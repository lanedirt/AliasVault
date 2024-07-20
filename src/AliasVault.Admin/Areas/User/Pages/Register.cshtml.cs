using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AliasServerDb;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AliasVault.Areas.User.Pages;

public class RegisterModel : PageModel
{
    private readonly SignInManager<AdminUser> _signInManager;
    private readonly UserManager<AdminUser> _userManager;

    public RegisterModel(SignInManager<AdminUser> signInManager, UserManager<AdminUser> userManager)
    {
        _signInManager = signInManager;
        _userManager = userManager;
    }

    [BindProperty] public InputModel Input { get; set; } = new();

    public void OnGet()
    {
        // Check if the user is already logged in
        if (_signInManager.IsSignedIn(User))
        {
            // Redirect to user login page (which will redirect to home page)
            Response.Redirect("/user/login");
        }
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (ModelState.IsValid)
        {
            var identity = new AdminUser { UserName = Input.Email, Email = Input.Email };
            var result = await _userManager.CreateAsync(identity, Input.Password);

            if (result.Succeeded)
            {
                await _signInManager.SignInAsync(identity, isPersistent: false);
                return LocalRedirect("/");
            }

            // Add the errors from the result to the model state
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        return Page();
    }

    public class InputModel
    {
        [Required] [EmailAddress] public string Email { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]

        //[RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$", ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Password)]
        [DisplayName("Confirm password")]
        [Compare("Password", ErrorMessage = "Password and confirmation password do not match.")]
        public string PasswordConfirm { get; set; } = string.Empty;

        [Required]
        [DisplayName("I agree with the terms and conditions")]
        [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the terms and conditions.")]
        public bool AcceptTerms { get; set; }
    }
}
