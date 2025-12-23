import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      role: string;
    }

    interface Request {
      user?: User;
    }
  }
}

// Also augment express-serve-static-core as some versions of @types/express 
// depend on it for the Request interface definition.
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}
