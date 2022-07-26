using System.Text;
using System.Text.Json;
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
app.UseCors(MyAllowSpecificOrigins);

IConfiguration config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .AddEnvironmentVariables().Build();

// Load env variables
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

app.MapPost("/sessions", async (HttpRequest request) =>
{
    String contentString;
    HttpContent content;
    using (var streamContent = new StreamContent(request.Body)) {
        contentString = await streamContent.ReadAsStringAsync();
        content = new StringContent(contentString, Encoding.UTF8, "application/json");
    }
    HttpResponseMessage response = await client.PostAsync("openvidu/api/sessions", content);
    if (response.StatusCode == HttpStatusCode.Conflict) {
        // Session already exists in OpenVidu
        var bodyRequest = JsonSerializer.Deserialize<Dictionary<string, object>>(contentString);
        return bodyRequest["customSessionId"];
    }
    response.EnsureSuccessStatusCode();
    var responseBody = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
    var sessionId = responseBody["sessionId"].ToString().Trim('"');
    return sessionId;
});

app.MapPost("/sessions/{sessionId}/connections", async (HttpRequest request, [FromRoute] string sessionId) =>
{
    HttpContent content;
    using (var streamContent = new StreamContent(request.Body)) {
        var contentString = await streamContent.ReadAsStringAsync();
        content = new StringContent(contentString, Encoding.UTF8, "application/json");
    }
    HttpResponseMessage response = await client.PostAsync("openvidu/api/sessions/" + sessionId + "/connection", content);
    response.EnsureSuccessStatusCode();
    var responseBody = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
    var token = responseBody["token"].ToString().Trim('"');
    return token;
});

app.Run();