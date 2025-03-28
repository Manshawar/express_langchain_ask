import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

declare type WebError = Error & { status?: number };
export const errorHandler = (err: WebError, req: Request, res: Response, next: NextFunction): void => {


  if (err && err.name === "UnauthorizedError") {
    const { status = 401, message } = err;
    // 抛出401异常
    res.status(status).json({
      code: status,
      message: "token失效，请重新登录",
      data: null,
    });
  } else {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error", { title: err.name, message: err.message });
  }

};

export const errorNotFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(createError(404));
};
