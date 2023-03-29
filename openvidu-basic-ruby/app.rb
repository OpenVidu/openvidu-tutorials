#!/usr/bin/ruby

require 'sinatra'
require 'sinatra/cors'
require 'faraday'
require 'json'
require './env.rb'

# Load env variables
SERVER_PORT = ENV['SERVER_PORT']
OPENVIDU_URL = ENV['OPENVIDU_URL']
OPENVIDU_SECRET = ENV['OPENVIDU_SECRET']

set :port, SERVER_PORT

register Sinatra::Cors
set :allow_origin, "*"
set :allow_methods, "POST,OPTIONS"
set :allow_headers, "content-type"

post '/api/sessions' do
  begin
    body = request.body.read
    response = Faraday.post do |req|
      req.url "#{OPENVIDU_URL}openvidu/api/sessions"
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Basic #{Base64.encode64("OPENVIDUAPP:#{OPENVIDU_SECRET}").strip}"
      req.body = body
    end
    if response.success?
      (JSON.parse response.body)['sessionId']
    else
      if response.status == 409
        # Session already exists in OpenVidu
        (JSON.parse body)['customSessionId']
      else
        status response.status
        body response.body
      end
    end
  rescue Faraday::Error => err
    err.response
  end
end

post '/api/sessions/:sessionId/connections' do
  begin
    body = request.body.read
    response = Faraday.post do |req|
      req.url "#{OPENVIDU_URL}openvidu/api/sessions/#{params['sessionId']}/connection"
      req.headers['Content-Type'] = 'application/json'
      req.headers['Authorization'] = "Basic #{Base64.encode64("OPENVIDUAPP:#{OPENVIDU_SECRET}").strip}"
      req.body = body
    end
    if response.success?
      (JSON.parse response.body)['token']
    else
      status response.status
      body response.body
    end
  rescue Faraday::Error => err
    err.response
  end
end