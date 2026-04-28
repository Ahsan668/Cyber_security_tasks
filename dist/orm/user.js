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
const alasql_1 = __importDefault(require("alasql"));
const post_1 = __importDefault(require("./post"));
const security_1 = require("../security");
// A user in the system
class User {
    constructor(username, // Login name
    password, // Unhashed password
    fullName, // Display name for the user interface
    id) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.id = id;
    }
    // Find the unique user with a matching id
    // returns null if there is no such user
    static byId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sanitize ID to ensure it's a safe integer (prevents SQL injection)
            const sanitizedId = security_1.sanitizeId(id);
            if (sanitizedId === null) {
                return null;
            }
            const users = yield User.byWhere(`id = ${sanitizedId}`);
            if (users.length > 0)
                return users[0];
            else
                return null;
        });
    }
    // Find the unique user with a matching login username
    // returns null if there is no such user
    static byLogin(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use single quotes escape to prevent SQL injection
            // username and password are properly escaped before being used in SQL
            const escapedUsername = username.replace(/'/g, "''");
            const users = yield User.byWhere(`username = '${escapedUsername}'`);
            // If user found, verify password using bcrypt
            if (users.length > 0) {
                const user = users[0];
                // Verify the password matches the stored hash
                const isPasswordValid = yield security_1.verifyPassword(password, user.password);
                if (isPasswordValid) {
                    return user;
                }
            }
            return null;
        });
    }
    // Find all users matching the supplied SQL 'where' clause
    static byWhere(where, order) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield alasql_1.default.promise(`select id, username, password, fullName
             from users
             where ${where}
             ` + (order ? `order by ${order}` : ''));
            return rows.map(row => new User(row.username, row.password, row.fullName, row.id));
        });
    }
    // Create a new user in the database
    // Updates 'this' with the new 'id'
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Hash the password before storing in database
                // Passwords should NEVER be stored in plain text
                const hashedPassword = yield security_1.hashPassword(this.password);
                // Escape special characters to prevent SQL injection
                const escapedUsername = this.username.replace(/'/g, "''");
                const escapedFullName = this.fullName.replace(/'/g, "''");
                yield alasql_1.default.promise(`insert into users (username, password, fullName)
                 values ('${escapedUsername}', '${hashedPassword}', '${escapedFullName}')`);
                // Retrive the identifier of the new row
                this.id = alasql_1.default.autoval('users', 'id');
            }
            catch (e) {
                throw new Error('Username already exists');
            }
        });
    }
    // Find all friends of this user
    // (i.e., users that this user has connected to)
    findFriends() {
        return User.byWhere(`id in (
                    select friendTo
                    from friends
                    where friendFrom = ${this.id}
             )`, 'fullName asc');
    }
    // Find all users in the system who the user could befriend (connect)
    // (i.e., users that this user has not already connected to)
    findNotFriends() {
        return User.byWhere(`id not in (
                    select friendTo
                    from friends
                    where friendFrom = ${this.id}
                    union all
                    select ${this.id}
             )`, 'fullName asc');
    }
    // Find all posts by this user
    findPosts() {
        return post_1.default.byWhere(`creator = ${this.id}`, 'creationDate desc');
    }
    // Find all posts by this user and friends of this user
    findFriendPosts() {
        return post_1.default.byWhere(`creator in (
                select friendTo
                from friends
                where friendFrom = ${this.id}
                union all
                select ${this.id}
             )`, 'creationDate desc');
    }
}
exports.default = User;
//# sourceMappingURL=user.js.map