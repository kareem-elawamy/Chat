using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.DTOs
{
    public class MessageRequestDto
    {
        public int Id { get; set; }
        public string? ReceiverId { get; set; }
        public string? Content { get; set; }
        public string? SenderId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
}