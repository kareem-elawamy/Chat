

using System.ComponentModel.DataAnnotations;

namespace Api.DTOs
{
    public class RegisterDTOs
    {
        [Required]
        public IFormFile? ProfileImage { get; set; }
        [Required]
        [RegularExpression(@"^[a-zA-Z0-9]+$", ErrorMessage = "Username must contain only letters and digits")]
        public string UserName { get; set; } = string.Empty;
        [Required, DataType(DataType.EmailAddress), EmailAddress, RegularExpression(@"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$", ErrorMessage = "Invalid Email Address")]

        public string Email { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        

    }
}