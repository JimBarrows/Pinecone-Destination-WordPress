/**
 * Created by JimBarrows on 7/8/16.
 */
'use strict';
import amqp from "amqplib";
import promise from "bluebird";
import Promise from "bluebird";
import moment from "moment";
import wordpress from "wordpress";
import mongoose from "mongoose";
import Content from "pinecone-models/src/Content";
import Channel from "pinecone-models/src/Channel";
mongoose.Promise = Promise;
mongoose.connect('mongodb://mongo/pinecone');
const wp = promise.promisifyAll(wordpress);

const queueName  = 'wordperfect';
const connection = amqp.connect('amqp://rabbitmq');
const channel    = connection.then((conn) =>conn.createChannel());

promise.join(connection, channel, (con, ch) =>
				ch.assertQueue(queueName, {durable: true})
						.then(() => ch.consume(queueName, function (msg) {

							let transmissionReport = {
								timeStart: moment()
							};
							let contentId          = msg.content.toString();
							let contentP           = Content.findById(mongoose.Types.ObjectId(contentId));
							let channelP           = contentP.then((content)=> Channel.findById(content.channel));

							promise.join(contentP, channelP, (content, channel) => {
								if (channel) {
									channel.wordPressDestinations.forEach((destination) => {
										transmissionReport.channel     = channel._id;
										transmissionReport.destination = destination._id;
										transmissionReport.status      = 'started';
										let {username, password, url} = destination;
										let wpClient                   = wp.createClient({username, password, url});
										wpClient.newPostAsync({
													content: content.body,
													excerpt: content.wpFields.excerpt,
													format: content.wpFields.format,
													name: content.slug,
													status: content.wpFields.status,
													title: content.title,
													type: content.wpFields.type
												})
												.then((data) => {
													transmissionReport.status = "success";
												})
												.catch((error) => {
													transmissionReport.status = "failure";
													transmissionReport.error  = error;
												})
												.finally(() => {
													transmissionReport.timeEnd = moment();
													content.transmissionReports.push(transmissionReport);
													content.save()
															.then((updatedContent) => {
																if (updatedContent.status === "failure") {
																	channel.reject(msg, false);
																}
															});
												});
									})
								} else {
									transmissionReport.timeEnd = moment();
									transmissionReport.status  = "failure";
									transmissionReport.error   = "No channel provided.";
									content.transmissionReports.push(transmissionReport);
									content.save()
											.then((updatedContent) => {
												if (updatedContent.status === "failure") {
													channel.reject(msg, false);
												}
											});
								}
							})

						}, {noAck: true})))
		.catch((error) => consolelog("Error receiving wordpress: ", error));