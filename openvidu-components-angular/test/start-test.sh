#!/bin/bash

TUTORIALS=(
  '../openvidu-additional-panels'
  '../openvidu-admin-dashboard'
  '../openvidu-custom-activities-panel'
  '../openvidu-custom-chat-panel'
  '../openvidu-custom-layout'
  '../openvidu-custom-panels'
  '../openvidu-custom-participant-panel-item'
  '../openvidu-custom-participant-panel-item-elements'
  '../openvidu-custom-participants-panel'
  '../openvidu-custom-stream'
  '../openvidu-custom-toolbar'
  '../openvidu-custom-ui'
  '../openvidu-toggle-hand'
  '../openvidu-toolbar-buttons'
  '../openvidu-toolbar-panel-buttons'
)
# Inicializar contadores de tests exitosos y fallidos
SUCCESS=0
FAILURE=0

for tutorial in "${TUTORIALS[@]}"
do
  echo "Processing $tutorial..."


  if [ -d "$tutorial" ]; then

    cd "$tutorial" || { echo "Cannot enter directory $tutorial"; exit 1; }
    rm -rf node_modules
    rm -f package-lock.json
    npm install openvidu-components-angular@latest


#  Verificar si el puerto 5080 está en uso y matar el proceso si es necesario
    PORT_IN_USE=$(lsof -i :5080 | grep LISTEN)
    if [ -n "$PORT_IN_USE" ]; then
      echo "Port 5080 is in use. Killing the process..."
      kill -9 $(lsof -ti :5080)
    fi


    # Iniciar la aplicación
    echo "Starting the application in $tutorial..."
    npm run start &
    APP_PID=$!

    # Esperar un tiempo para que la aplicación se inicie
    sleep 20

    # Ejecutar el test
    echo "Running test for $tutorial..."
    node ../test/test.js

     # Verificar si el test falló
    if [ $? -eq 1 ]; then
      echo "ERROR!! Test failed for $tutorial"
      ((FAILURE++)) # Incrementar el contador de fallos
    else
      ((SUCCESS++)) # Incrementar el contador de éxitos
    fi


    # Detener la aplicación
    echo "Stopping the application in $tutorial..."
    kill $APP_PID
    wait $APP_PID 2>/dev/null # Esperar a que el proceso se detenga antes de continuar

    cd - || { echo "Cannot return to previous directory"; exit 1; }
  else
    echo "Directory $tutorial does not exist."
  fi
done

# Mostrar resumen de los tests
echo "Summary:"
echo "Successful tests: $SUCCESS"
echo "Failed tests: $FAILURE"