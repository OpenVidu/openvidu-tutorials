exec $HOME/ngrok start --all -config=$HOME/ngrok.yml > $HOME/ngrok.log &
while true
do
	sleep 100000
done
exit 0
