import pymysql


# Django's MySQL backend imports MySQLdb. The project ships PyMySQL instead of
# mysqlclient, so register its compatible implementation during Django startup.
pymysql.install_as_MySQLdb()
