const Redis = require('ioredis');
const EventEmitter = require('events');

let redisClient;
let publisher;
let subscriber;
let isMock = false;


class MockRedisClient extends EventEmitter {
  constructor() {
    super();
    this.store = {};
    console.log('⚠️ Using In-Memory Mock Redis Client');
  }

  async get(key) {
    const item = this.store[key];
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      delete this.store[key];
      return null;
    }
    return item.value;
  }

  async set(key, value, mode, duration) {
    let expiry = null;
    if (mode === 'EX' || mode === 'ex') {
      expiry = Date.now() + duration * 1000;
    }
    this.store[key] = { value, expiry };
    return 'OK';
  }

  async del(key) {
    if (Array.isArray(key)) {
      key.forEach(k => delete this.store[k]);
    } else {
      delete this.store[key];
    }
    return 1;
  }

  async flushall() {
    this.store = {};
    return 'OK';
  }

  async publish(channel, message) {
  
    if (subscriber && subscriber.subscribedChannels.has(channel)) {
      subscriber.emit('message', channel, message);
    }
    return 1;
  }

  async subscribe(channel) {
    if (!this.subscribedChannels) {
      this.subscribedChannels = new Set();
    }
    this.subscribedChannels.add(channel);
    return 1;
  }
}

const initializeRedis = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
    
    try {
      redisClient = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            console.warn('❌ Redis connection failed. Falling back to mock store.');
            switchToMock();
            return null; 
          }
          return 100; 
        }
      });

      redisClient.on('error', (err) => {
        
        if (!isMock) {
          console.warn('❌ Redis Error: ' + err.message);
          switchToMock();
        }
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis Client Connected');
      });

      
      publisher = new Redis(redisUrl || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: 1 });
      subscriber = new Redis(redisUrl || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: 1 });
      
      publisher.on('error', () => {});
      subscriber.on('error', () => {});
    } catch (e) {
      console.warn('❌ Redis Initialization Failed. Falling back to mock.');
      switchToMock();
    }
  } else {
    
    try {
      redisClient = new Redis(redisUrl);
      publisher = new Redis(redisUrl);
      subscriber = new Redis(redisUrl);

      redisClient.on('error', (err) => {
        console.error('Redis client error:', err);
      });
    } catch (error) {
      console.error('Failed to create cloud Redis instances, falling back to mock:', error);
      switchToMock();
    }
  }
};

function switchToMock() {
  if (isMock) return;
  isMock = true;
  redisClient = new MockRedisClient();
  publisher = redisClient;
  subscriber = new MockRedisClient();
  
  subscriber.subscribedChannels = new Set();
}

initializeRedis();

module.exports = {
  redisClient,
  publisher,
  subscriber,
  isMock: () => isMock,
};
