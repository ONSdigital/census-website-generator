export default function rateLimiter(array, callback, concurrency_limit = 50) {
    debugger;
    return new Promise(resolve => {
      const arrayLength = array.length;
  
      let index = -1;
      let completedItems = 0;
  
      async function next() {
        index++;
  
        const item = array[index];
  
        await callback(item);
  
        completedItems++;
  
        if (index < arrayLength - 1) {
          next();
        }
  
        if (completedItems === arrayLength) {
          resolve();
        }
      }
  
      for (let i = 0; i < Math.min(concurrency_limit, arrayLength); i++) {
        next();
      }
    });
  }