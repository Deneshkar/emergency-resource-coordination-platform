using ERCP.Api.DTOs;
using ERCP.Api.Models;

namespace ERCP.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> AuthenticateAsync(LoginRequestDto request);
    Task<(bool Success, string? Error, AuthResponseDto? Response)> RegisterAsync(RegisterRequestDto request);
    string GenerateJwtToken(User user);
    string HashPassword(User user, string password);
    bool VerifyPassword(User user, string hashedPassword, string providedPassword);
    
    Task<bool> GeneratePasswordResetOtpAsync(string email);
    Task<(bool Success, string Message)> ResetPasswordWithOtpAsync(string email, string otp, string newPassword);
}
