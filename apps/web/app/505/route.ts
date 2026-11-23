import { errorResponse } from "@/lib/error-pages";

export function GET(request: Request) {
  return errorResponse(request, 505);
}
