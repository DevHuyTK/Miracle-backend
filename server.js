require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const path = require("path");

//const Routes
const userRoute = require("./api/routers/AccountRouters.js");
const photoRoute = require("./api/routers/ImgRouters.js");
const chatRoute = require("./api/routers/ChatRouters.js");
const postRoute = require("./api/routers/PostRouters.js");
const User = require("./api/models/UserModel.js");
const Chat = require("./api/models/ChatModel.js");
const Post = require("./api/models/PostModel.js");
const Comment = require("./api/models/CommentModel.js");
const Like = require("./api/models/LikeModel.js");

const app = express();
const port = process.env.PORT || 8000;

// socket io
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

//Connect to MongoDB
mongoose.Promise = global.Promise;
mongoose
	.connect(process.env.DB_CONNECT || "DB_CONNECT", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: "Miracle",
		useFindAndModify: false,
	})
	.then(() => {
		console.log("Connected !!!");
	})
	.catch((err) => {
		console.log(err);
	});

//Express file-upload
app.use(
	fileUpload({
		createParentPath: true,
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);
app.use(express.static(path.join("public/images")));

//Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
//Router Middlewares
// app.use("/post", postRoute);

app.use("/api/user", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/photo", photoRoute);
app.use("/api/post", postRoute);

//SETUP Socket-io
io.on("connection", async (socket) => {
	// join
	socket.on("join", async ({ token, userIds }) => {
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);

		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userIds);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;

		if (!targetUser) {
			socket.emit("join-response", {
				status: 0,
				message: "Không tìm thấy id người cùng phòng chat",
			});
			return;
		}

		const userIdCheck = user.matching_list.map((item) => {
			return item._id;
		});
		const targetUserIdCheck = targetUser.matching_list.map((item) => {
			return item._id;
		});

		const user_match = {
			user_id: verifiedUser._id,
			username: verifiedUser.username,
			full_name: verifiedUser.full_name,
			avatar: verifiedUser.avatar,
			create_at: Date.now(),
		};
		const targetUser_match = {
			user_id: verifiedTargetUser._id,
			username: verifiedTargetUser.username,
			full_name: verifiedTargetUser.full_name,
			avatar: verifiedTargetUser.avatar,
			create_at: Date.now(),
		};

		if (
			userIdCheck.includes(verifiedTargetUser._id.toString()) ||
			targetUserIdCheck.includes(verifiedUser._id.toString()) ||
			userIdCheck.length === 0 ||
			targetUserIdCheck.length === 0
		) {
			await User.findByIdAndUpdate(verified._id, {
				matching_list: [...user.matching_list, targetUser_match],
			});
			await User.findByIdAndUpdate(userIds, {
				matching_list: [...targetUser.matching_list, user_match],
			});
			const unique = [verified._id, userIds].sort((a, b) =>
				a < b ? -1 : 1
			);
			const roomId = `${unique[0]}-${unique[1]}`;
			socket.join(roomId);

			const matchingList_1 = await Promise.all(
				[...user.matching_list].map(async (item) => {
					const unique = [verified._id, item._id].sort((a, b) =>
						a < b ? -1 : 1
					);
					const roomId = `${unique[0]}-${unique[1]}`;
					const message = await Chat.findOne(
						{ room_id: roomId },
						{},
						{ sort: { created_at: -1 } }
					);
					if (message) {
						return {
							...item,
							had_message: true,
							message,
						};
					} else {
						return {
							...item,
							had_message: false,
						};
					}
				})
			);

			const matchingList_2 = await Promise.all(
				[...targetUser.matching_list].map(async (item) => {
					const unique = [userIds, item._id].sort((a, b) =>
						a < b ? -1 : 1
					);
					const roomId = `${unique[0]}-${unique[1]}`;
					const message = await Chat.findOne(
						{ room_id: roomId },
						{},
						{ sort: { created_at: -1 } }
					);
					if (message) {
						return {
							...item,
							had_message: true,
						};
					} else {
						return {
							...item,
							had_message: false,
						};
					}
				})
			);

			socket.emit("join-response", {
				status: 1,
				message: "Đã matched người vào phòng",
				data: [
					...matchingList_1,
					{ ...verifiedTargetUser, had_message: false },
				],
			});
			socket.broadcast.to(roomId).emit("join-response", {
				status: 1,
				message: "Đã matched người vào phòng",
				data: [
					...matchingList_2,
					{
						...verifiedUser,
						had_message: false,
					},
				],
			});
			return;
		} else {
			const unique = [verified._id, userIds].sort((a, b) =>
				a < b ? -1 : 1
			);
			const roomId = `${unique[0]}-${unique[1]}`;
			socket.join(roomId);
		}

		socket.emit("join-response", {
			status: 1,
			message: `Join room thành công`,
		});
	});

	//COMMENT POST
	socket.on("user-comment", async ({ token, postId, comment }) => {
		if (!token) {
			socket.emit("user-comment-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const posts = await Post.findById(postId);
		const verifiedPosts = { ...posts._doc };
		const user = await User.findById(verified._id);
		const verifiedUser = { ...user._doc };
		delete verifiedUser.password;

		const userPost = User.findById(verifiedPosts.user_id);
		const verifiedUserPost = { ...userPost._doc };
		delete verifiedUserPost.password;

		if (!posts) {
			socket.emit("user-comment-response", {
				status: 0,
				message: "Không tìm thấy bài viết!",
			});
			return;
		}
		const Comment = {
			user_id: verifiedUser._id,
			username: verifiedUser.username,
			full_name: verifiedUser.full_name,
			comment,
			avatar: verifiedUser.avatar,
			create_at: Date.now(),
		};

		// const comment1 = new Comment({
		// 	user_id: verifiedUser._id,
		// 	username: verifiedUser.username,
		// 	full_name: verifiedUser.full_name,
		// 	comment: comment,
		// 	avatar: verifiedUser.avatar,
		// 	create_at: Date.now(),
		// });
		// await comment1.save();

		await Post.findByIdAndUpdate(verifiedPosts._id, {
			comments: [...posts.comments, Comment],
		});

		socket.broadcast.emit("user-comment-response", {
			status: 1,
			message: `${verifiedUser.full_name} đã bình luận bài viết của ${verifiedUserPost.full_name}`,
			data: Comment,
		});
	});

	//LIKE POST
	socket.on("like-post", async ({ token, postId }) => {
		if (!token) {
			socket.emit("like-post-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const posts = await Post.findById(postId);
		const verifiedUser = { ...user._doc };
		const verifiedPosts = { ...posts._doc };
		delete verifiedUser.password;
		if (!posts) {
			socket.emit("like-post-response", {
				status: 0,
				message: "Không tìm thấy bài viết!",
			});
			return;
		}

		const like = {
			user_id: verifiedUser._id,
			username: verifiedUser.username,
			full_name: verifiedUser.full_name,
			avatar: verifiedUser.avatar,
			create_at: Date.now(),
		};

		await Post.findByIdAndUpdate(verifiedPosts._id, {
			like_count: [...posts.like_count, like],
		});
		socket.emit("like-post-response", {
			status: 1,
			message: `Thích bài viết thành công`,
		});
		socket.broadcast.emit("like-post-response", {
			status: 1,
			message: `${verifiedUser.full_name} đã thích bài viết của bạn`,
			post_id: postId,
		});
	});

	//UNLIKE POST
	socket.on("unlike-post", async ({ token, postId }) => {
		if (!token) {
			socket.emit("unlike-post-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const posts = await Post.findById(postId);
		const verifiedUser = { ...user._doc };
		const verifiedPosts = { ...posts._doc };
		delete verifiedUser.password;
		if (!posts) {
			socket.emit("unlike-post-response", {
				status: 0,
				message: "Không tìm thấy bài viết!",
			});
			return;
		}

		await Post.findByIdAndUpdate(verifiedPosts._id, {
			like_count: [
				...posts.like_count.filter(
					(item) => item.user_id !== verifiedUser._id
				),
			],
		});
		socket.emit("unlike-post-response", {
			status: 1,
			message: `Bỏ Thích bài viết thành công`,
		});
		socket.broadcast.emit("unlike-post-response", {
			status: 1,
			message: `${verifiedUser.full_name} đã bỏ thích bài viết của bạn`,
			post_id: postId,
		});
	});

	//follow
	socket.on("follow-user", async ({ token, userId }) => {
		if (!token) {
			socket.emit("follow-user-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;
		if (!targetUser) {
			socket.emit("follow-user-response", {
				status: 0,
				message: "Không tìm thấy người bạn theo dõi!",
			});
			return;
		}

		const follower = {
			user_id: verifiedUser._id,
			username: verifiedUser.username,
			full_name: verifiedUser.full_name,
			avatar: verifiedUser.avatar,
			create_at: Date.now(),
		};
		const following = {
			user_id: verifiedTargetUser._id,
			username: verifiedTargetUser.username,
			full_name: verifiedTargetUser.full_name,
			avatar: verifiedTargetUser.avatar,
			create_at: Date.now(),
		};

		await User.findByIdAndUpdate(verifiedUser._id, {
			following_list: [...user.following_list, following],
		});
		await User.findByIdAndUpdate(verifiedTargetUser._id, {
			follower_list: [...targetUser.follower_list, follower],
		});
		socket.emit("follow-user-response", {
			status: 1,
			message: `Theo dõi ${verifiedTargetUser.full_name} thành công`,
		});
		socket.broadcast.emit("follow-user-response", {
			status: 1,
			message: `${verifiedUser.full_name} đã theo dõi bạn`,
			user_id: userId,
		});
	});

	//UNFOLLOW
	socket.on("unfollow-user", async ({ token, userId }) => {
		if (!token) {
			socket.emit("unfollow-user-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;
		if (!targetUser) {
			socket.emit("unfollow-user-response", {
				status: 0,
				message: "Không tìm thấy người bạn huy theo dõi!",
			});
			return;
		}

		await User.findByIdAndUpdate(verifiedUser._id, {
			following_list: [
				...user.following_list.filter(
					(item) => item.username !== verifiedTargetUser.username
				),
			],
		});
		await User.findByIdAndUpdate(verifiedTargetUser._id, {
			follower_list: [
				...targetUser.follower_list.filter(
					(item) => item.username !== verifiedUser.username
				),
			],
		});
		socket.emit("unfollow-user-response", {
			status: 1,
			message: `Hủy dõi ${verifiedTargetUser.full_name} thành công`,
		});
	});
	// chat
	socket.on("send-message", async ({ token, userId, message }) => {
		if (!token) {
			socket.emit("send-message-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		if (!userId) {
			socket.emit("send-message-response", {
				status: 0,
				message: "Thiếu UserId",
			});
			return;
		}
		if (!message.trim()) {
			socket.emit("send-message-response", {
				status: 0,
				message: "Thiếu tin nhắn",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;

		const unique = [verified._id, userId].sort((a, b) => (a < b ? -1 : 1));
		const roomId = `${unique[0]}-${unique[1]}`;

		const data = new Chat({
			message,
			created_at: Date.now(),
			user_post: verifiedUser,
			user_id: verifiedUser._id,
			room_id: roomId,
			is_seen: false,
		});
		await data.save();
		const matchingList = await Promise.all(
			[...verifiedTargetUser.matching_list].map(async (item) => {
				if (verified._id === item._id) {
					return {
						...item,
						had_message: true,
						message: data,
					};
				} else {
					return item;
				}
			})
		);
		socket.broadcast.to(roomId).emit("send-message-response", {
			status: 1,
			message: "Có tin nhắn mới",
			data: data,
			matching_list: matchingList,
		});
	});
	// seen
	socket.on("seen-message", async ({ token, userId }) => {
		if (!token) {
			socket.emit("send-message-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}
		if (!userId) {
			socket.emit("send-message-response", {
				status: 0,
				message: "Thiếu UserId",
			});
			return;
		}
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "TOKEN_SECRET"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;

		const unique = [verified._id, userId].sort((a, b) => (a < b ? -1 : 1));
		const roomId = `${unique[0]}-${unique[1]}`;
		const chat = await Chat.updateMany(
			{ room_id: roomId, user_id: userId },
			{ is_seen: true }
		);

		const returnedMatchingList = await Promise.all(
			[...verifiedUser.matching_list].map(async (item) => {
				const unique = [verifiedUser._id, item._id].sort((a, b) =>
					a < b ? -1 : 1
				);
				const roomId = `${unique[0]}-${unique[1]}`;
				const message = await Chat.findOne(
					{ room_id: roomId },
					{},
					{ sort: { created_at: -1 } }
				);

				if (message) {
					return {
						...item,
						had_message: true,
						message,
					};
				} else {
					return {
						...item,
						had_message: false,
					};
				}
			})
		);
		socket.emit("seen-message-response", {
			status: 1,
			message: "Xem tin nhắn thành công",
			data: returnedMatchingList,
		});
	});
	// disconnect
	socket.on("disconnect", () => {
		// console.log("user disconnected");
	});
});

server.listen(port, () =>
	console.log("Server Up and Running in port: " + port)
);
