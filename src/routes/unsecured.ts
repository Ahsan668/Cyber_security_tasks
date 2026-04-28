/*
 * WARNING!
 *
 * This project is intentionally insecure.
 *
 * DO NOT use in production.
 *
 * It is designed for educational purposes - to teach common vulnerabilities in web applications.
 */

import Router from 'express-promise-router';
import { User, Post, raw } from '../orm';
import { sanitizeId } from '../security';
const route = Router();

//--------------------------------------------------------
// Routes that *should* only be used by logged in users
// Note: these are intentionally not properly secured
//--------------------------------------------------------

// Shows the list of posts by a friend
route.get('/posts_friend', async (req, res) => {
    // Sanitize the friend ID to prevent SQL injection
    const friendId = sanitizeId(Number(req.query.friend));
    if (friendId === null) {
        res.render('posts_friend', { view: 'posts_friend', friend: null, posts: [], error: 'Invalid friend ID' });
        return;
    }

    const friend = await User.byId(friendId);
    let posts: Post[] = [];
    if (friend != null)
        posts = await friend.findPosts();
    res.render('posts_friend', { view: 'posts_friend', friend, posts});
});

// Like a post and redirect to the 'back' parameter
route.get('/like', async (req, res) => {
    // Sanitize post ID to prevent SQL injection
    const postId = sanitizeId(Number(req.query.post));
    if (postId === null) {
        res.status(400).send('Invalid post ID');
        return;
    }

    const back = String(req.query.back || '/');
    const friendId = req.query.friend ? sanitizeId(Number(req.query.friend)) : null;

    const post = await Post.byId(postId);
    if (post != null) {
        await post.like();
    }
    res.redirect(303, back + (friendId ? `?friend=${friendId}` : ''));
});

// Show the admin zone
route.get('/admin', (_req, res) => {
    res.render('admin', { view: 'admin'});
});

// Handle a query posted to the admin zone
route.post('/admin', async (req, res) => {
    const query = String(req.body.query);
    let rows = null;
    let errors = null;
    try {
        // Perform the SQL query
        const results = await raw(query);

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
    } catch (e) {
        errors = e.toString();
    }
    res.render('admin', { view: 'admin', query, rows, errors });
});

export default route;