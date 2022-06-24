using System.Text;
using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Enable CORS support
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      builder =>
                      {
                          builder.WithOrigins("*").AllowAnyHeader();
                      });
});

var app = builder.Build();
app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);

IConfiguration config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .AddEnvironmentVariables().Build();

var OPENVIDU_URL = config.GetValue<string>("OPENVIDU_URL");
var OPENVIDU_SECRET = config.GetValue<string>("OPENVIDU_SECRET");

// Allow for insecure certificate in OpenVidu deployment
var handler = new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
};
HttpClient client = new HttpClient(handler);
client.BaseAddress = new System.Uri(OPENVIDU_URL);

// Set OpenVidu deployment secret
var basicAuth = Convert.ToBase64String(System.Text.ASCIIEncoding.UTF8.GetBytes($"OPENVIDUAPP:{OPENVIDU_SECRET}"));
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);

app.MapPost("/sessions", async (HttpContext context) =>
{
    HttpContent content = new StringContent(context.Request.Body.ToString(), Encoding.UTF8, "application/json");
    HttpResponseMessage response = await client.PostAsJsonAsync("openvidu/api/sessions", content);
    if (response.StatusCode == HttpStatusCode.Conflict) {
        var json = await context.Request.ReadFromJsonAsync<Dictionary<string, object>>();
        return json["customSessionId"];
    }
    response.EnsureSuccessStatusCode();
    var responseBody = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
    return responseBody["sessionId"];
});

app.MapPost("/sessions/{sessionId}/connections", async ([FromRoute] string sessionId, [FromBody] string json) =>
{
    HttpContent content = new StringContent(json, Encoding.UTF8, "application/json");
    HttpResponseMessage response = await client.PostAsync("openvidu/api/sessions/" + sessionId + "/connections", content);
    response.EnsureSuccessStatusCode();
    string responseBody = await response.Content.ReadAsStringAsync();
});

app.Run();