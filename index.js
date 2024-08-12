import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


//connecting to mongodb
mongoose
  .connect('mongodb://localhost:27017', {
    dbName: 'backend',
  })
  .then(() => console.log('database connected'))
  .catch((e) => console.log(e))

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
})

const User = mongoose.model('User', userSchema)

const app = express()

// using middleweares
app.use(express.static(path.join(path.resolve(), 'public')))

app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

// setting up view engine
app.set('view engine', 'ejs')

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies

  if (token) {
    const decoded = jwt.verify(token, 'fwfgwiufweib')

    req.user = await User.findById(decoded._id)

    next()
  } else {
    res.redirect('login')
  }
}

app.get('/', isAuthenticated, (req, res) => {
  res.render('logout', { name: req.user.name })
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/registerFirst',  (req, res) => {
  res.render('registerFirst')
})


app.post('/login', async (req, res) => {
  const {password,email} = req.body
  let user = await User.findOne({email});
   if(!user) return res.redirect('/registerFirst')

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) return res.render('login',  { email, message:"Incorrect Password"})

        const token = jwt.sign({ _id: user._id }, 'fwfgwiufweib')

        res.cookie('token', token),
          {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000),
          }
        res.redirect('/')
})

app.post('/registerFirst', async (req, res) => {
  const { name, email, password } = req.body
 8
  let user = await User.findOne({email})
  if(user){
    return res.redirect('/login')
  }

  const hashPassword = await bcrypt.hash(password, 10);
   user = await User.create({
    name,
    email,
    password: hashPassword,
  })

  const token = jwt.sign({ _id: user._id }, 'fwfgwiufweib')

  res.cookie('token', token),
    {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
    }
  res.redirect('/')
})

app.get('/logout', (req, res) => {
  res.cookie('token', null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  })
  res.redirect('/')
})

app.listen(5000, () => {
  console.log('server is working')
})