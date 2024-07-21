namespace AliasVault.Admin.Areas.Auth.Pages;

using System.ComponentModel.DataAnnotations;
using AliasServerDb;
using AliasVault.Admin.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.IdentityModel.Tokens;

public class LoginModel : PageModel
{
    private readonly SignInManager<AdminUser> _signInManager;
    private readonly UserService _userService;

    public LoginModel(SignInManager<AdminUser> signInManager, UserService userService)
    {
        _signInManager = signInManager;
        _userService = userService;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    public string? ReturnUrl { get; set; }

    public string SuccessMessage { get; set; } = string.Empty;

    public void OnGet()
    {
        if (!Request.Query["returnUrl"].IsNullOrEmpty())
        {
            ReturnUrl = Request.Query["returnUrl"].ToString();
        }

        if (!Request.Query["emailConfirmed"].IsNullOrEmpty())
        {
            if (Request.Query["emailConfirmed"] == "true")
            {
                SuccessMessage = "Your email address has been confirmed. You can now log in.";
            }
        }
        else if (!Request.Query["passwordReset"].IsNullOrEmpty())
        {
            if (Request.Query["passwordReset"] == "true")
            {
                SuccessMessage = "Check your mailbox for the password reset link.";
            }
        }
        else if (!Request.Query["passwordChanged"].IsNullOrEmpty())
        {
            if (Request.Query["passwordChanged"] == "true")
            {
                SuccessMessage = "Your password has been changed. You can now log in.";
            }
        }

        // Check if the user is already logged in
        if (_signInManager.IsSignedIn(User))
        {
            // Redirect to home page
            Response.Redirect(GetInAppRedirectUrl());
        }
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (ModelState.IsValid)
        {
            var result = await _signInManager.PasswordSignInAsync(Input.Email ?? "", Input.Password ?? "", isPersistent: false,
                lockoutOnFailure: false);

            if (Request.Query["returnUrl"] != String.Empty)
            {
                ReturnUrl = Request.Query["returnUrl"].ToString();
            }

            if (result.Succeeded)
            {
                return LocalRedirect(GetInAppRedirectUrl());
            }
            else if (result.IsNotAllowed)
            {
                // The account hasn't been confirmed
                ModelState.AddModelError(string.Empty, "You must confirm your email address before you can sign in.");
            }
            else
            {
                // Add error to the model state
                ModelState.AddModelError(string.Empty, "The login attempt failed. Check if the email and password are correct and try again. If you don't remember your password, you can reset it.");
            }
        }

        return Page();
    }

    public string GetInAppRedirectUrl()
    {
        if (ReturnUrl != null && Url.IsLocalUrl(ReturnUrl))
        {
            return ReturnUrl;
        }

        return "/";
    }

    public class InputModel
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string? Password { get; set; }
    }
}
