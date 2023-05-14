using AspNetCore.Identity.MongoDbCore.Infrastructure;
using backend_mongo;
using backend_mongo.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Web;
var builder = WebApplication.CreateBuilder(args);

var mongoDbSettings = builder.Configuration.GetSection(nameof(MongoDbConfig)).Get<MongoDbConfig>();

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>()
.AddMongoDbStores<ApplicationUser, ApplicationRole, Guid>
(
            mongoDbSettings.ConnectionString, mongoDbSettings.Name
        );

//"mongodb+srv://henry:c3ftpZsFnD1IHI9Q@cluster0.cmesnql.mongodb.net/?retryWrites=true&w=majority"
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
