"use strict";
/*
 * WARNING!
 *
 * This project is intentionally insecure.
 *
 * DO NOT use in production.
 *
 * It is designed for educational purposes - to teach common vulnerabilities in web applications.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_promise_router_1 = __importDefault(require("express-promise-router"));
const orm_1 = require("../orm");
const security_1 = require("../security");
const route = express_promise_router_1.default();
//--------------------------------------------------------
// Routes that *should* only be used by logged in users
// Note: these are intentionally not properly secured
//--------------------------------------------------------
// Shows the list of posts by a friend
route.get('/posts_friend', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Sanitize the friend ID to prevent SQL injection
    const friendId = security_1.sanitizeId(Number(req.query.friend));
    if (friendId === null) {
        res.render('posts_friend', { view: 'posts_friend', friend: null, posts: [], error: 'Invalid friend ID' });
        return;
    }
    const friend = yield orm_1.User.byId(friendId);
    let posts = [];
    if (friend != null)
        posts = yield friend.findPosts();
    res.render('posts_friend', { view: 'posts_friend', friend, posts });
}));
// Like a post and redirect to the 'back' parameter
route.get('/like', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Sanitize post ID to prevent SQL injection
    const postId = security_1.sanitizeId(Number(req.query.post));
    if (postId === null) {
        res.status(400).send('Invalid post ID');
        return;
    }
    const back = String(req.query.back || '/');
    const friendId = req.query.friend ? security_1.sanitizeId(Number(req.query.friend)) : null;
    const post = yield orm_1.Post.byId(postId);
    if (post != null) {
        yield post.like();
    }
    res.redirect(303, back + (friendId ? `?friend=${friendId}` : ''));
}));
// Show the admin zone
route.get('/admin', (_req, res) => {
    res.render('admin', { view: 'admin' });
});
// Handle a query posted to the admin zone
route.post('/admin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = String(req.body.query);
    let rows = null;
    let errors = null;
    try {
        // Perform the SQL query
        const results = yield orm_1.raw(query);
        // Convert the results from any[]
        // into [string[], ...any[][]]
        rows = [];
        if (results && results.length > 0) {
            // Use the first row of results to get the column names
            const header = [];
            for (const key in results[0])
                header.push(key);
            rows.push(header);
            // Now iterate through each row to build an array of values
            for (const result of results) {
                const row = [];
                for (const key of header)
                    row.push(result[key]);
                rows.push(row);
            }
        }
    }
    catch (e) {
        errors = e.toString();
    }
    res.render('admin', { view: 'admin', query, rows, errors });
}));
exports.default = route;
//# sourceMappingURL=unsecured.js.map