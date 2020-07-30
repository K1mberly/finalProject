const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Tutorials = require('../models/tutorial');

const tutorialRouter = express.Router();

tutorialRouter.use(bodyParser.json());

tutorialRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Tutorials.find({})
            .populate('comments.author')
            .then((tutorials) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(tutorials);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Tutorials.create(req.body)
            .then((tutorial) => {
                console.log('Tutorial created ', tutorial);
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(tutorial);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /tutorials');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Tutorials.remove({})
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

tutorialRouter.route('/:tutorialId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .populate('comments.author')
            .then((tutorial) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(tutorial);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /tutorials/' + req.params.tutorialId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Tutorials.findByIdAndUpdate(req.params.tutorialId, {
            $set: req.body
        }, { new: true })
            .then((tutorial) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(tutorial);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Tutorials.findOneAndRemove(req.params.tutorialId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });


tutorialRouter.route('/:tutorialId/comments')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .populate('comments.author')
            .then((tutorial) => {
                if (tutorial != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    res.json(tutorial.comments);
                } else {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .then((tutorial) => {
                if (tutorial != null) {
                    console.log("post", tutorial);
                    req.body.author = req.user._id;
                    console.log(req.body.author);
                    console.log(req.body);
                    tutorial.comments.push(req.body);
                    tutorial.save()
                        .then((tutorial) => {
                            console.log("tutorial", tutorial);
                            Tutorials.findById(tutorial._id)
                            .populate('comments.author')
                            .then((tutorial) => {
                                console.log("tutorial22", tutorial);
                                    res.statusCode = 200;
                                    res.setHeader('Content-type', 'application/json');
                                    res.json(tutorial);
                                });
                        });
                } else {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /tutorials/' + req.params.tutorialId + '/comments');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .then((tutorial) => {
                if (tutorial != null) {
                    for (var i = (tutorial.comments.length - 1); i >= 0; i--) {
                        tutorial.comments.id(tutorial.comments[i]._id).remove();
                    }
                    tutorial.save()
                        .then((tutorial) => {
                            res.statusCode = 200;
                            res.setHeader('Content-type', 'application/json');
                            res.json(tutorial);
                        });
                } else {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.json(tutorial);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

tutorialRouter.route('/:tutorialId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .populate('comments.author')
            .then((tutorial) => {
                if (tutorial != null && tutorial.comments.id(req.params.commentId) != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    res.json(tutorial.comments.id(req.params.commentId));
                } else if (tutorial == null) {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /tutorials/' + req.params.tutorialId + '/comments/' + req.params.commentId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .then((tutorial) => {
                if (tutorial != null && tutorial.comments.id(req.params.commentId) != null) {
                    var commentAuthor = tutorial.comments.id(req.params.commentId).author;
                    var actualUser = req.user._id;
                    if (actualUser.equals(commentAuthor)) {
                        if (req.body.rating) {
                            tutorial.comments.id(req.params.commentId).rating = req.body.rating;
                        }
                        if (req.body.comment) {
                            tutorial.comments.id(req.params.commentId).comment = req.body.comment;
                        }
                        tutorial.save()
                            .then((tutorial) => {
                                Tutorials.findById(tutorial._id)
                                    .populate('comments.author')
                                    .then((tutorial) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(tutorial);
                                    });
                            }, (err) => next(err));
                    } else {
                        err = new Error('You are not authorized to update this comment!');
                        err.status = 403;
                        return next(err);
                    }
                }
                else if (tutorial == null) {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Tutorials.findById(req.params.tutorialId)
            .then((tutorial) => {
                if (tutorial != null && tutorial.comments.id(req.params.commentId) != null) {
                    var commentAuthor = tutorial.comments.id(req.params.commentId).author;
                    var actualUser = req.user._id;
                    if (actualUser.equals(commentAuthor)) {
                        tutorial.comments.id(req.params.commentId).remove();
                        tutorial.save()
                            .then((tutorial) => {
                                Tutorials.findById(tutorial._id)
                                    .populate('comments.author')
                                    .then((tutorial) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(tutorial);
                                    });
                            }, (err) => next(err));
                    } else {
                        err = new Error('You are not authorized to update this comment!');
                        err.status = 403;
                        return next(err);
                    }

                }
                else if (tutorial == null) {
                    err = new Error('Tutorial ' + req.params.tutorialId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });
module.exports = tutorialRouter;