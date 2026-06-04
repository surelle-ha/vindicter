import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ApiResponse<T> {
    success: true;
    data: T;
    meta: ResponseMeta;
}
export interface ResponseMeta {
    requestId: string;
    timestamp: string;
    version: string;
    path: string;
    method: string;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>;
}
