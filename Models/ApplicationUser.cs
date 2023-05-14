using AspNetCore.Identity.MongoDbCore.Models;
using MongoDbGenericRepository.Attributes;
using System;

namespace backend_mongo.Models
{

    
        [CollectionName("Users")]
        public class ApplicationUser : MongoIdentityUser<Guid>
        {
        }
    
}
