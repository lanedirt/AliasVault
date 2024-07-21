namespace AliasVault.Admin.Areas.Auth.Pages;

using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class ResetPasswordModel : PageModel
{
    private readonly UserManager<AdminUser> _userManager;

    public ResetPasswordModel(UserManager<AdminUser> userManager)
    {
        _userManager = userManager;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    public async Task<IActionResult> OnGet()
    {
        var userId = Request.Query["userId"];

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            // Error: User not found
            return LocalRedirect("/user/login");
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (ModelState.IsValid)
        {
            var userId = Request.Query["userId"];
            var code = Request.Query["code"];

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                // Error: User not found
                return LocalRedirect("/user/login");
            }

            var result = await _userManager.ResetPasswordAsync(user, code, Input.Password);
            if (result.Succeeded)
            {
                return LocalRedirect("/user/login?passwordChanged=true");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        return Page();
    }

    public class InputModel
    {
        [Required]
        [DisplayName("Enter new password")]
        [DataType(DataType.Password)]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        //[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        [DisplayName("Confirm new password")]
        [Compare("Password", ErrorMessage = "Password and confirmation password do not match.")]
        public string PasswordConfirm { get; set; } = string.Empty;
    }
}
