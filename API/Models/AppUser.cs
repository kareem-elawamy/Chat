using System;
using Microsoft.AspNetCore.Identity;

namespace API.Models;

public class AppUser:IdentityUser
{
    
    public string? FullName { get; set; }

    public string? ProfileIamge { get; set; }
    public NationalIdInfo? NationalIdInfo { get; set; }
}
