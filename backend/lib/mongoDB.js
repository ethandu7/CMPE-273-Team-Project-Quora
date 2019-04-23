var mongoose = require('mongoose')
var User = require('../models/user')
var Message = require('../models/message')

const uri_altas = 'mongodb+srv://admin:admin@quora-2jksh.mongodb.net/';
const uri_local = 'mongodb://localhost:27017/quora';
mongoose.Promise = global.Promise
mongoose.connect(uri_altas, {
    dbName: 'quora',
    useNewUrlParser: true,
    poolSize: 100,
    useFindAndModify: false,
    keepAlive: true, 
    keepAliveInitialDelay: 300000,
    useCreateIndex: true
})

mongoose.connection.once('open', () => {
    console.log('connection to mongoDB is open');
})

mongoose.connection.on('connecting', () => {
    console.log('connecting to mongoDB');
})
mongoose.connection.on('connected', () => {
    console.log('connected to mongoDB');
})
mongoose.connection.on('disconnected', () => {
    console.log('lost connection to mongoDB');
})
mongoose.connection.on('close', () => {
    console.log('connection to mongoDB was closed')
})
mongoose.connection.on('error', () => {
    throw new Error('unable to connect to mongoDB')
})


exports.insertUser = (user) => {
    let newUser = new User(user);
    return newUser.save();
}

exports.findUserByEmail = (email) => {
    console.log('findUserByEmail: ', email);
    return User.findOne({email: email}).exec();
}

exports.findUserByID = (id) => {
    return User.find({user_id: id}).exec();
}

exports.findAvatarPathByID = (id) => {
    return User.findOne({user_id: id}, {'_id': 0, 'avatar': 1}).exec();
}

exports.updateUser = (user) => {
    return User.findOneAndUpdate({user_id: user.id}, user).exec();
}

exports.insertMessage = (userid, message) => {
    const newMessage = new Message(message);
    return newMessage.save()
    .then(message => {
        return User.findOneAndUpdate({user_id: userid}, {$push: {messages: message._id}}).exec();
    });
}

exports.getMessagesByUserID = (userid) => {
    return User.findOne({user_id: userid})
        .populate({
            path: 'messages',
        }).select('messages -_id').exec();
}

exports.readMessage = (messageid) => {
    return Message.findOneAndUpdate({message_id: messageid}, {$set: {status: 'readed'}}).exec();
}