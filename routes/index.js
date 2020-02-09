var express = require('express');
var router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const bcrypt = require("bcrypt-nodejs");
const multer = require("multer");
var mongoXlsx = require('../mongo-xlsx/lib/mongo-xlsx');
let User = require('../model/user');
let Customer = require('../model/customer');

// multer configuration
var storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function (req, file, cb) {
    const ext = file.mimetype.split('/')[1];
    cb(null, 'fcmb -' + Date.now() + '.' + ext);
  }
})

// FILE CHECK
function checkFileType(type) {
  return function (req, file, cb) {
    // Allowed ext
    let filetypes;
    if (type == "images") {
      filetypes = /jpeg|jpg|png|gif/;
    }

    // Get ext
    const extname = file.mimetype.split('/')[1];

    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      req.flash('error', 'upload images only')
      cb(new Error(`Error Occured: Upload ${type.toUpperCase()} Only!`));
    }
  };
}

let upload = multer({ storage: storage, fileFilter: checkFileType("images") });

function checkLoginStatus(req, res, next) {
  if (req.isAuthenticated()) {
    email = req.user.email;
    return next();
  }
  req.flash('error', 'Login to continue');
  res.redirect('/');
}

/* GET home page. */
router.route('/')
  .get((req, res, next) => {
    res.render('index'); 
  })
  .post(passport.authenticate("local.loginAdmin", {
    successRedirect: "/dashboard",
    failureRedirect: "/",
    failureFlash: true
  }))

router.get('/dashboard', checkLoginStatus, (req, res) => {
  res.render('dashboard');
})
router.get('/download-database', async (req, res) => {
  let payload =await Customer.find({}).select('-createdDate -__v -_id -passport');

  let data = [{
    fullName: 'Joshua Olabiran',
    email: 'jo@jokkkkkd',
    address: '36, James Onifade Street Akesan, Lagos',
    gender: 'F',
    stateOfO: 'Abia',
    dob: '2020 - 01 - 07T00: 00: 00.000Z',
    phoneNum: 8093481350,
    accNum: 8093481350,
    bvn: 8093481350
  }]
  /* Generate automatic model for processing (A static model should be used) */
  var model = mongoXlsx.buildDynamicModel(data);

  /* Generate Excel */
  mongoXlsx.mongoData2Xlsx(payload, model, function (err, payload) {
    // i intentionally edited the nodemodule(mongo-xlsx) for easy manipulation of filename
    res.download('./mongo-xlsx.xlsx');
  });

})
/* Register Super Admin*/
// router.get('/superAdmin/register', (req, res, next) => {
//   const user = new User({
//     name: 'Olabiran Joshua Olaiya',
//     email: 'olabiranj@gmail.com',
//     password: (new User).generateHash("joe")
//   });
//   user.save()
//     .then(() => console.log('Super admin added...'));
// });

router.route('/create-customer')
  .all(checkLoginStatus)
  .get((req, res, next) => {
    res.render('createCustomer')
  })
  .post(upload.single('passport'), async(req, res) => {
    const file = req.file;
    const customer = new Customer({
      fullName: req.body.fullName,
      passport: file.path,
      email: req.body.email,
      address: req.body.address,
      gender: req.body.gender,
      stateOfO: req.body.stateOfO,
      dob: req.body.dob,
      phoneNum: req.body.phoneNum,
      accNum: Math.floor(100000000 + Math.random() * 900000000),
      bvn: req.body.bvn
    })
    try {
      await customer.save();
      req.flash('success', 'Customer Created Successfully');
      res.redirect("create-customer");
      console.log(customer)
    } catch (err) {
      if (err.code == 11000) {
        req.flash('error', 'Customer with same bvn number already exist');
        res.redirect("create-customer");
        console.log(err)
      } else {
        req.flash('error', 'Customer could not be created');
        res.redirect("create-customer");
        console.log(err)
      }
      
    }
  })

router.get('/customer-list/:page', checkLoginStatus, async(req, res) => {
  let perPage = 30;
  let page = req.params.page || 1;
  let count = await Customer.countDocuments()
  let payload = await Customer.find({}).sort({ createdDate: -1 }).skip((perPage * page) - perPage).limit(perPage)
  res.render('staffList', { payload, current: page, count, pages: Math.ceil(count / perPage)})
})
router.route('/edit-customer/:id')
  .all(checkLoginStatus)
  .get(async (req, res) => {
    let payload = await Customer.findOne({ _id: req.params.id })
    res.render('editStaff', { payload })
    console.log(payload.fullName)
  })
  .post(async (req, res) => {
    try {
      let payload = await Customer.findOneAndUpdate(
        { _id: req.params.id },
        {
          fullName: req.body.fullName,
          oracleNum: req.body.oracleNum,
          email: req.body.email,
          address: req.body.address,
          commFileNo: req.body.commFileNo,
          lgFileNo: req.body.lgFileNo,
          phoneNum: req.body.phoneNum,
        })
      req.flash('success', 'Record Updated Successfully');
      res.redirect("back");
    } catch (err) {
      if (err.code == 11000) {
        req.flash('error', 'Staff with same email or oracle number already exist');
        res.redirect("back");
        console.log(err)
      } else {
        req.flash('error', 'Record Could not be updated');
        res.redirect("back");
      }
    }
  })
router.post('/delete-employee/:id', checkLoginStatus, async (req, res) => {
  await Customer.findOneAndDelete({ _id: req.params.id });
  req.flash('success', 'Record deleted successfully')
  res.redirect('/staff-list/1');
})

/* GET edit email page. */
router.route('/change-email')
  .all(checkLoginStatus)
  .get((req, res, next) => {
    res.render('changeEmail', { email: req.user.email})
  })
  .post(async (req, res) => {
    let { email2 } = req.body;
    let anyEmail = await User.findOne({ email: email2 })
    if (anyEmail) {
      req.flash('error', `Email could not be changed!`);
      res.redirect('back');
    } else {
      await User.findOneAndUpdate({ email: req.user.email }, { email: email2 })
      req.flash('success', `Your email has been changed to ${email2}`);
      res.redirect('back');
    }
  })

/* GET edit password page. */
router.route('/change-password')
  .all(checkLoginStatus)
  .get((req, res, next) => {
    res.render('changePassword')
  })
  .post(async (req, res) => {
    let { oldPassword, password1, password2 } = req.body;
    let thisUser = await User.findOne({ email: req.user.email });
    let passHash = (new User).generateHash(password2);
    try {
      if (!thisUser.validatePassword(oldPassword)) {
        req.flash('error', `This is not your current password!`);
        res.redirect('back');
      } else {
        await User.findOneAndUpdate({ email: req.user.email }, { password: passHash })
        req.flash('success', `Your Password has been changed`);
        res.redirect('back');
      }
    } catch (error) {
      console.log(error);
      req.flash('error', `Something went wrong`);
      res.redirect('back');
    }
  })

router.post('/search-employee', async(req, res) => {
  try {
    let payload = await Customer.findOne({bvn: req.body.bvn })
    if (payload) {
      res.render('editStaff', { payload })
      console.log(payload)
    } else {
      req.flash('error', 'An employee with such oracle number does not exist, kindly search through the list of staff');
      res.redirect('/customer-list/1')
    }
  } catch (error) {
    req.flash('error', 'An employee with such oracle number does not exist, kindly search through the list of staff');
    res.redirect('/customer-list/1')
  }
})
router.get("/adminLogout", checkLoginStatus, function (req, res) {
  req.logout();
  res.redirect("/");
});
module.exports = router;
