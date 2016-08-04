'use strict';

export  default {
	development: {
		mongoose: {
			url: 'mongodb://localhost/pinecone'
		},
		rabbitMq: {
			url: 'amqp://localhost',
			queueName: 'wordperfect'
		}
	},
	production: {
		mongoose: {
			url: 'mongodb://mongo/pinecone'
		},
		rabbitMq: {
			url: 'amqp://rabbitmq',
			queueName: 'wordperfect'
		}
	}
}
