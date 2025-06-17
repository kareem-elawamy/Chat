using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Api.DTOs;
using API.Data;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AccountController(IConfiguration configuration, UserManager<AppUser> userManager, IWebHostEnvironment env, AppDbContext context)
        {
            _configuration = configuration;
            _userManager = userManager;
            _env = env;
            _context = context;
        }

        [AllowAnonymous]
        [HttpPost("Register")]
        public async Task<IActionResult> Register(RegisterDTOs model)
        {
            try
            {

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var user = new AppUser
                {

                    FullName = model.UserName,
                    Email = model.Email,
                    UserName = model.UserName,
                    EmailConfirmed = true,

                };
                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }
                // save profile image
                if (model.ProfileImage != null)
                {
                    //save profile image

                    var fileName = $"{Guid.NewGuid()}_{model.ProfileImage.FileName}";
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/profile_images", fileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await model.ProfileImage.CopyToAsync(stream);
                    }
                    user.ProfileIamge = $"/profile_images/{fileName}";

                    await _userManager.UpdateAsync(user);
                }


                // await _userManager.AddToRoleAsync(user, "User");

                var token = GenerateTokenAsync(user);

                return Ok(new AuthResponseDto
                {
                    IsSuccess = true,
                    Tokens = await token,
                    Message = "User created successfully. Please check your email to confirm your account."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("Login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDtos loginDtos)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var user = await _userManager.FindByEmailAsync(loginDtos.Email);
                if (user is null)
                {
                    return Unauthorized(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    });
                }

                if (!user.LockoutEnabled)
                {
                    return BadRequest(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = user.Email + " is Blocked"
                    });
                }
                var result = await _userManager.CheckPasswordAsync(user, loginDtos.Password);
                if (!result)
                {
                    return Unauthorized(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "InValid Password"
                    }
                );
                }
                var token = GenerateTokenAsync(user);
                Console.WriteLine($"Generated Token: {token}");
                return Ok(new AuthResponseDto
                {
                    IsSuccess = true,
                    Tokens = await token,
                    Message = "Login Succes"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        // [HttpPost("CreateRole")]
        // public async Task<IActionResult> CreateRole(CreateRoleDto RoleDto)
        // {
        //     try
        //     {

        //         if (string.IsNullOrEmpty(RoleDto.RoleName))
        //             return BadRequest("Role name is required");
        //         var RoleExists = await _roleManager.RoleExistsAsync(RoleDto.RoleName);
        //         if (RoleExists)
        //             return BadRequest("Role already exist");
        //         var role = new IdentityRole
        //         {
        //             Name = RoleDto.RoleName
        //         };
        //         var result = await _roleManager.CreateAsync(role);
        //         if (result.Succeeded)
        //         {
        //             return Ok(new { message = "Role Created successfully" });
        //         }
        //         return BadRequest("Role Can not falied\n" + result);
        //     }
        //     catch (Exception ex)
        //     {
        //         return BadRequest(ex.Message);
        //     }
        // }
        [HttpGet("GetUserDetails")]
        [Authorize]
        public async Task<IActionResult> GetUserDetails()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    });
                }
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    });
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        private async Task<string> GenerateTokenAsync(AppUser user)
        {
            try
            {
                var tokenHeader = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_configuration["JWTSetting:securityKey"]!);
                var roles = await _userManager.GetRolesAsync(user);
                List<Claim> claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Email,user.Email?? ""),
                new Claim(JwtRegisteredClaimNames.NameId,user.Id?? ""),
                new Claim(JwtRegisteredClaimNames.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(JwtRegisteredClaimNames.Aud, _configuration.GetSection("JWTSetting:ValidAudience").Value!),
                new Claim(JwtRegisteredClaimNames.Iss, _configuration.GetSection("JWTSetting:ValidIssuer").Value!)


            };
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }
                var tokenDes = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(1),
                    SigningCredentials = new SigningCredentials(
                        new SymmetricSecurityKey(key),
                        SecurityAlgorithms.HmacSha256)
                };
                var token = tokenHeader.CreateToken(tokenDes);
                return tokenHeader.WriteToken(token);
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }


    }
}