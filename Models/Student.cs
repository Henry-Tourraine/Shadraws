using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend_mongo.Models
{
    public class Student
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public int Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; }
    }
}


