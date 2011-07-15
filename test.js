var cachejs = process.argv[2];
if(!cachejs || !(cachejs === 'cache' || cachejs === 'cacheBase')){
		console.log('Usage: node test.js [cache|cacheBase]');
		process.exit(-1);
}

var Cache = require('./'+cachejs);
var cache = new Cache(-1, false);

var i = 100000;
var begin = new Date();
begin = new Date();
console.log('bench '+cachejs+'.js');
while(i--){
		cache.setItem(1, Math.random(), {});
		cache.getItem(1);
}
console.log(new Date().getTime() - begin.getTime());