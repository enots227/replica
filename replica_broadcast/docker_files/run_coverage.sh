curr_path=$(pwd)

source "/opt/venv/bin/activate"
rm -r -f "/mnt/src/htmlcov"
rm -r -f "/mnt/src/.coverage"

cd /mnt/src/replica

export env='UNITTEST'

coverage run manage.py test --timing -v 2

export env='DEVELOPMENT'

mv ./.coverage ../.coverage

cd ..

coverage html

cd $curr_path
