
export const hapticService = {
  vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  },
  
  tap() {
    this.vibrate(10);
  },
  
  success() {
    this.vibrate([10, 30, 10]);
  },
  
  error() {
    this.vibrate([50, 50, 50]);
  },
  
  magic() {
    this.vibrate([20, 10, 20, 10, 40]);
  }
};
