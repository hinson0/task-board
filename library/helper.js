var Helper = {
    isEmptyObj: function(obj) {
        for (var key in obj) {
            return false;
        }
        return true;
    },
    isEmptyArray: function(arr) {
        return arr.length === 0 ? true : false;
    }
};

module.exports = Helper;