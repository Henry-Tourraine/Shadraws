using AspNetCore.Identity.MongoDbCore.Models;
using MongoDbGenericRepository.Attributes;
using System;


namespace backend_mongo.Models
{

 
        [CollectionName("Roles")]
        public class ApplicationRole : MongoIdentityRole<Guid>
        {

        }
    
}
