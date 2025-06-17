using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class Response<T>
    {
        public bool isSuccess { get; }
        public string? Message { get; set; }
        public T? Data { get; }
        public string? Error { get; }
        public Response(bool success, T? data, string? error, string? message)
        {
            isSuccess = success;
            Message = message;
            Data = data;
            Error = error;

        }
        public static Response<T> Success(T data, string? message = "") =>
            new Response<T>(true, data, null, message);
        public static Response<T> Failure(string error) =>
            new Response<T>(false, default, error, null);

    }
}