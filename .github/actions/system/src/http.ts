import { StatusCodes } from "http-status-codes";

export function isSuccessStatusCode(statusCode: StatusCodes)
{
    return statusCode >= 200 && statusCode <= 299;
}
