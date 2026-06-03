using Xunit;
using TaskManagement.API.Helpers;

namespace TaskManagement.Tests
{
    public class PasswordHasherTests
    {
        [Fact]
        public void Hash_ShouldReturnSameHash_ForSamePassword()
        {
            // Arrange
            var password = "MySecurePassword123";

            // Act
            var hash1 = PasswordHasher.Hash(password);
            var hash2 = PasswordHasher.Hash(password);

            // Assert
            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void Hash_ShouldReturnDifferentHash_ForDifferentPasswords()
        {
            // Arrange
            var password1 = "PasswordOne";
            var password2 = "PasswordTwo";

            // Act
            var hash1 = PasswordHasher.Hash(password1);
            var hash2 = PasswordHasher.Hash(password2);

            // Assert
            Assert.NotEqual(hash1, hash2);
        }
    }
}
