class CustomError extends Error{
    statusCode;
    message;
    constructor(statusCode,message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}
module.exports = CustomError;