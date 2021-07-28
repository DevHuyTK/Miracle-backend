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
const User = require("./api/models/UserModel.js");
const Chat = require("./api/models/ChatModel.js");
const Follower = require("./api/models/FollowerModel.js");
const Following = require("./api/models/FollowingModel.js");

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
	.connect(
		process.env.DB_CONNECT ||
			"mongodb+srv://devhuy:Anhhuy123@miracledb.vqptk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
			dbName: "Miracle",
			useFindAndModify: false,
		}
	)
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

//SETUP Socket-io
io.on("connection", async (socket) => {
	console.log("a user connected");
	// join
	socket.on("join", async ({ token, userIds }) => {
		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "super_cool_secret"
		);
		const rooms = [];
		for (let userId of userIds) {
			const unique = [verified._id.toString(), userId.toString()].sort(
				(a, b) => (a < b ? -1 : 1)
			);
			const roomId = `${unique[0]}-${unique[1]}`;
			rooms.push(roomId);
		}
		socket.join(rooms);
		socket.emit("join-response", {
			status: 1,
			message: `Join room thành công`,
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
			process.env.TOKEN_SECRET || "super_cool_secret"
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

		const follower = new Follower({
			user_id: verifiedUser._id,
			full_name: verifiedUser.full_name,
			avatar: verifiedUser.avatar,
			create_at: Date.now(),
		});
		const following = new Following({
			user_id: verifiedTargetUser._id,
			full_name: verifiedTargetUser.full_name,
			avatar: verifiedTargetUser.avatar,
			create_at: Date.now(),
		});

		const user_follower = await follower.save();
		const user_following = await following.save();

		const getFollowerPopulate = function (id) {
			return User.findById(id).populate("follower_list", "-_id -__v");
		};
		const getFollowingPopulate = function (id) {
			return User.findById(id).populate("following_list", "-_id -__v");
		};

		resultFollower = await getFollowerPopulate(user_follower._id);
		resultFollowing = await getFollowingPopulate(user_following._id);

		// await User.findByIdAndUpdate(verified._id, {
		// 	following_list: [...user.following_list, verifiedTargetUser],
		// });
		// await User.findByIdAndUpdate(userId, {
		// 	follower_list: [...targetUser.follower_list, verifiedUser],
		// });
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
	// matching
	socket.on("like-user", async ({ token, userId }) => {
		if (!token) {
			socket.emit("like-user-response", {
				status: 0,
				message: "Thiếu token",
			});
			return;
		}

		const verified = jwt.verify(
			token,
			process.env.TOKEN_SECRET || "super_cool_secret"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;
		if (!targetUser) {
			socket.emit("like-user-response", {
				status: 0,
				message: "Không tìm thấy người bạn thích",
			});
			return;
		}
		if (user) {
			if (
				user.matched_list.findIndex(
					(item) => item._id.toString() === userId.toString()
				) !== -1
			) {
				socket.emit("like-user-response", {
					status: 0,
					message: "Đã thích người này",
				});
				return;
			}
			await User.findByIdAndUpdate(verified._id, {
				matched_list: [...user.matched_list, verifiedTargetUser],
			});

			if (
				targetUser.matched_list.findIndex(
					(item) => item._id.toString() === verified._id.toString()
				) !== -1
			) {
				await User.findByIdAndUpdate(verified._id, {
					matching_list: [...user.matching_list, verifiedTargetUser],
				});
				await User.findByIdAndUpdate(userId, {
					matching_list: [...targetUser.matching_list, verifiedUser],
				});
				if (
					verifiedUser.user_liked_you.findIndex(
						(item) =>
							item._id.toString() ===
							verifiedTargetUser._id.toString()
					) !== -1
				) {
					const new_user_liked_you = [...verifiedUser.user_liked_you];
					const index = new_user_liked_you.findIndex(
						(item) =>
							item._id.toString() ===
							verifiedTargetUser._id.toString()
					);
					new_user_liked_you.splice(index, 1);
					await User.findByIdAndUpdate(verified._id, {
						user_liked_you: new_user_liked_you,
					});
				}
				const unique = [
					verified._id.toString(),
					userId.toString(),
				].sort((a, b) => (a < b ? -1 : 1));
				const roomId = `${unique[0]}-${unique[1]}`;
				socket.join(roomId);

				const matchingList_1 = await Promise.all(
					[...user.matching_list].map(async (item) => {
						const unique = [
							verified._id.toString(),
							item._id.toString(),
						].sort((a, b) => (a < b ? -1 : 1));
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
						const unique = [
							userId.toString(),
							item._id.toString(),
						].sort((a, b) => (a < b ? -1 : 1));
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

				socket.emit("like-user-response", {
					status: 1,
					message: "Đã tìm thấy người phù hợp",
					data: [
						...matchingList_1,
						{ ...verifiedTargetUser, had_message: false },
					],
				});
				socket.broadcast.to(roomId).emit("like-user-response", {
					status: 1,
					message: "Đã tìm thấy người phù hợp",
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
				const unique = [
					verified._id.toString(),
					userId.toString(),
				].sort((a, b) => (a < b ? -1 : 1));
				const roomId = `${unique[0]}-${unique[1]}`;
				socket.join(roomId);
				if (
					targetUser.user_liked_you.findIndex(
						(item) =>
							item._id.toString() === verified._id.toString()
					) === -1
				) {
					await User.findByIdAndUpdate(userId, {
						user_liked_you: [
							...targetUser.user_liked_you,
							verifiedUser,
						],
					});
				}
			}

			socket.emit("like-user-response", {
				status: 1,
				message: "Thích người này thành công",
			});
			socket.broadcast.emit("like-user-response", {
				status: 1,
				message: "Đã có người thích bạn",
				user_id: userId,
				data: [...user.user_liked_you, verified._id],
			});
		}
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
			process.env.TOKEN_SECRET || "super_cool_secret"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;

		const unique = [verified._id.toString(), userId.toString()].sort(
			(a, b) => (a < b ? -1 : 1)
		);
		const roomId = `${unique[0]}-${unique[1]}`;

		const data = new Chat({
			message,
			created_at: new Date(),
			user_post: verifiedUser,
			user_id: verifiedUser._id.toString(),
			room_id: roomId,
			is_seen: false,
		});
		await data.save();
		const followingList = await Promise.all(
			[...verifiedTargetUser.following_list].map(async (item) => {
				if (verified._id.toString() === item._id.toString()) {
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
			following_list: followingList,
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
			process.env.TOKEN_SECRET || "super_cool_secret"
		);
		const user = await User.findById(verified._id);
		const targetUser = await User.findById(userId);
		const verifiedUser = { ...user._doc };
		const verifiedTargetUser = { ...targetUser._doc };
		delete verifiedUser.password;
		delete verifiedTargetUser.password;

		const unique = [verified._id.toString(), userId.toString()].sort(
			(a, b) => (a < b ? -1 : 1)
		);
		const roomId = `${unique[0]}-${unique[1]}`;
		const chat = await Chat.updateMany(
			{ room_id: roomId, user_id: userId },
			{ is_seen: true }
		);

		const returnedMatchingList = await Promise.all(
			[...verifiedUser.matching_list].map(async (item) => {
				const unique = [
					verifiedUser._id.toString(),
					item._id.toString(),
				].sort((a, b) => (a < b ? -1 : 1));
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
		console.log("user disconnected");
	});
});

server.listen(port, () =>
	console.log("Server Up and Running in port: " + port)
);
