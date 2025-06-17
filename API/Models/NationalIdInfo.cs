using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Models
{
    public class NationalIdInfo
    {
        public int Id { get; set; }
        public string? UserId { get; set; } // Foreign key to AppUser
        public AppUser? User { get; set; } // Navigation property to AppUser

        public string? NationalIdNumber { get; set; } // National ID number
        public string? FullName { get; set; } // Full name as per the ID
        public string? Address { get; set; } // Address as per the ID
        public DateTime? DateOfBirth { get; set; } // Date of birth as per the ID
        public string? IssuedFrom { get; set; } // Issued from location

        public string? FrontImagePath { get; set; } // Path to the front image of the ID
        public string? BackImagePath { get; set; } // Path to the back image of the ID
    }
}