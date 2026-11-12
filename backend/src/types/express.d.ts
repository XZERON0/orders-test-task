export interface CurrentUser {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}
