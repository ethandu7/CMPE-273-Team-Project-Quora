var db = require('../../../backend/lib/mongoDB')


const insertQuestion = (user_id, question, next) => {
    let topics = question.topics.map(topic => topic._id);
    let que = {
        topics,
        user_id,
        content: question.content
    };
    db.insertQuestion(que).then(result =>{
        console.log("insert question result: ", result);
        db.bindUserQuestion(user_id, result._id)
        .then(res => {
            console.log("bind user question result: ", res);
            db.recordQuestionAsked(user_id, result._id)
            .then(res => {
                let promises = topics.map(topic_id => {
                    return db.bindTopicQuestion(topic_id, result._id);
                });
                Promise.all(promises)
                .then(res => {
                    next(null, {
                        status: 200,
                        data: {success: true}
                    });
                });
            });
        });
    });
}

const fetchQuestion = (req, next) => {
    db.fetchQuestion(req.questionid.question_id)
    .then(result => {
        console.log("Fetch question result: ", result);
        var questionFollowed = false;
        db.findUserFollowedQuestions(req.userid).then(result2 => {
            console.log("result2",result2)
            for(i = 0; i < result2.followed_questions.length; i++){
                if(req.questionid.question_id == result2.followed_questions[i]._id){
                    questionFollowed = true
                }
            }
            next(null, {
                status: 200,
                data: {question: result, questionFollowed: questionFollowed}
            });
        })
    });
}

const followQuestion = (req, next) => {
    var questionFollowed = false;
    db.findUserFollowedQuestions(req.userid).then(result => {
        console.log("result", result)
        for(i = 0; i < result.followed_questions.length; i++){
            if(req.questionid.question_id == result.followed_questions[i]._id){
                questionFollowed = true
            }
        }
        if(!questionFollowed && i == result.followed_questions.length){
            db.userFollowQuestion(req.userid, req.questionid.question_id).then(result2 =>{
                console.log("insert question result: ", result2);
                db.recordQuestionFollowed(req.userid, req.questionid.question_id)
                .then(res => {
                    db.increaseFollowerCounter(req.questionid.question_id)
                    .then(res => {
                        next(null, {
                            status: 200,
                            data: res
                        });
                    });
                });
            });
        }else{
            next(null, {
                status: 200,
                data: "Question has been followed"
            });
        }
    })
}

const search = (req, next) => {
    db.search(req.query.catagory, req.query.content).then(result => {
        next(null, {
            status: 200,
            data: result
        });
    })
}

const dispatch = (message, next) => {
    switch (message.cmd) {
        case 'INSERT_QUESTION':
            insertQuestion(message.user_id, message.question, next);
            break;
        case 'FETCH_QUESTION':
            fetchQuestion(message, next);
            break;
        case 'FOLLOW_QUESTION':
            followQuestion(message, next);
            break;
        case 'SEARCH':
            search(message, next);
            break;
        default: console.log('unknown request');
    }
}

module.exports={dispatch};