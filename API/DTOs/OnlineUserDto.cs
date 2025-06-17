using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class OnlineUserDto
    {
        public string? Id { get; set; }
        public string? ConnectionId { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? ProfileIamge { get; set; }
        public string? Email { get; set; }
        public bool IsOnline { get; set; }
        public int UnreadMessagesCount { get; set; }
    }
}