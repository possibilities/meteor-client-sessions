// Utils

Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + days);
  return this;
}
