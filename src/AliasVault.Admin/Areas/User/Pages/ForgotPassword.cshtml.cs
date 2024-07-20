using System.ComponentModel.DataAnnotations;
using System.Web;
using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
//using SendgridEmail;

namespace AliasVault.Areas.User.Pages;

public class ForgotPasswordModel : PageModel
{
    private readonly UserManager<AdminUser> _userManager;
    private readonly IConfiguration _configuration;
    //private readonly EmailService _emailService;

    public ForgotPasswordModel(SignInManager<AdminUser> signInManager, UserManager<AdminUser> userManager, IConfiguration configuration
        //EmailService emailService
        )
    {
        _userManager = userManager;
        _configuration = configuration;
        //_emailService = emailService;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    public void OnGet()
    {

    }

    public async Task<IActionResult> OnPostAsync()
    {

        if (ModelState.IsValid)
        {
            var user = await _userManager.FindByEmailAsync(Input.Email);
            if (user == null)
            {
                // User with the given email not found.
                // For security reasons, don't reveal this information.
                return LocalRedirect("/user/login?passwordReset=true");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            string encodedToken = HttpUtility.UrlEncode(token);

            // Send the token to the user's email
            string scheme = HttpContext.Request.Scheme; // "http" or "https"
            string host = HttpContext.Request.Host.Value; // the host name and port
            string baseUrl = $"{scheme}://{host}/";
            //await _emailService.SendUserPasswordForgotMailAsync(user, "UserEmailConfirm", baseUrl, encodedToken, _configuration["SendGridApiKey"] ?? "");

            return LocalRedirect("/user/login?passwordReset=true");

            // Add the errors from the result to the model state
            /*foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }*/
        }

        return Page();
    }

    public class InputModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
