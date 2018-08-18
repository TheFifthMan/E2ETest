# 安装docker
这里我们使用centos安装docker,[点我直达安装文档](https://docs.docker.com/install/linux/docker-ce/centos/)

简单的几步即可安装
```
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

sudo yum install docker-ce
sudo systemctl start docker
sudo docker run hello-world
```
然后发现连接不上镜像.

```
用 systemctl enable docker 启用服务后，编辑 /etc/systemd/system/multi-user.target.wants/docker.service 文件，
找到 ExecStart= 这一行，在这行最后添加加速器地址 --registry-mirror=<加速器地址>，如：

ExecStart=/usr/bin/dockerd --registry-mirror=https://rpwutt5n.mirror.aliyuncs.com
```


# 安装git
这里我们使用git来拉取代码，需要安装git

```
sudo yum install git -y
```

# 安装docker管理界面
为了防止对于命令行过敏的人群，我们还可以提供一个web管理界面让大家使用。[这里](https://portainer.io/)


简单的命令就可以部署：
```
# 先初始化为集群管理
[root@xxx-R3-srv ~]# docker swarm init
Swarm initialized: current node (410uoxsu2amj6czkkahimyln1) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-2i9apdywgkwqogjbydwn9fuu5r145pmc39218taseds1fokytr-0stcvbdkpisrhi9yg5pfq1g9e 192.168.31.215:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.

# 部署
docker service create \
--name portainer \
--publish 9000:9000 \
--replicas=1 \
--constraint 'node.role == manager' \
--mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \
--mount type=volume,src=portainer_data,dst=/data \
portainer/portainer \
-H unix:///var/run/docker.sock
```
# 服务器防火墙
centos 采用firewall做为防火墙，可以简单的disable掉

```
sudo systemctl stop firewalld
sudo systemctl disable firewalld 
```
为了安全，我们也可以简单学一下设置一下防火墙端口开放

```
firewall-cmd --zone=public --add-port=80/tcp(永久生效再加上 --permanent)
说明：
–zone 作用域
–add-port=8080/tcp 添加端口，格式为：端口/通讯协议
–permanent #永久生效，没有此参数重启后失效

# 重启防火墙
firewall-cmd --reload

```

# 安装selenoid
我们要基于selenoid搭建前端自动化平台。[官方文档](https://aerokube.com/selenoid/latest/)

selenoid有以下几个优点：
1. 基于docker的多种浏览器
2. 提供脚本执行时候的运行视频
3. 搭建方便，管理方便

下面就简单看一下官方文档学习一下.

#### quickstart

首先先写好配置文件

```
{
    "firefox": {
        "default": "57.0",
        "versions": {
            "57.0": {
                "image": "selenoid/vnc:firefox_57.0",
                "port": "4444",
                "path": "/wd/hub"
            }
        }
    }
}
```
然后在服务器启动
```
git clone https://github.com/TheFifthMan/E2ETest.git 

cd E2ETest

docker run -d                                   \
--name selenoid                                 \
-p 4444:4444                                    \
-v /var/run/docker.sock:/var/run/docker.sock    \
-v `pwd`/config/:/etc/selenoid/:ro              \
aerokube/selenoid:latest-release
```
启动seleniodui

```
DOCKER_GATEWAY_ADDR=`docker inspect selenoid -f {{.NetworkSettings.Gateway}}`

echo $DOCKER_GATEWAY_ADDR

docker run -d --name selenoid-ui -p 8080:8080 aerokube/selenoid-ui --selenoid-uri http://${DOCKER_GATEWAY_ADDR}:4444
```
然后我们就可以看到：

![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/seleniodui.jpg)

# 实际操作
上面只是很简单的入门，实际操作中我们还有更多的问题，比如，我们机器的资源是有限的，我们要限制docker启动的数量，还有我们可能需要测试多种浏览器的兼容，我们要保存log，我们要保存脚本操作的视频. 这里我们可以参考[文档](
https://aerokube.com/selenoid/latest/#_selenoid_cli_flags). 

#### 安装docker compose

参考地址：https://docs.docker.com/compose/install/#install-compose 
```
sudo curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```
#### 启动selenoid
对于selenoid，有几个需要注意的：
1. selenoidui界面：https://aerokube.com/selenoid-ui/latest/ 
2. selenoid的log
3. video的存储，没有自动删除的逻辑，需要我们写shell脚本进行删除

```
# pull镜像
$ docker pull selenoid/video-recorder

# 两种删除视频的方法

$ find /path/to/video/dir -mindepth 1 -maxdepth 1 -mmin +120 -name '*.mp4' | xargs rm -rf

$ curl -X DELETE http://selenoid-host.example.com:4444/video/<filename>.mp4
```


这里写了一个示例供参考，更多可以查看文档

```
version: '3'
services:
  selenoid:
    network_mode: bridge
    image: aerokube/selenoid:latest-release
    volumes:
      - "$PWD:/etc/selenoid"
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "$PWD/video/:/opt/selenoid/video"
      - "$PWD/logs/:/opt/selenoid/logs/"
    environment:
      - OVERRIDE_VIDEO_OUTPUT_DIR=$PWD/storedVideo/
    command: ["-log-output-dir","/opt/selenoid/logs","-conf", "/etc/selenoid/browsers.json", "-video-output-dir", "/opt/selenoid/video","-cpu","0.8","limit","7","-max-timeout","20m0s","-mem","500m"]
    ports:
      - "4444:4444"
  selenoid-ui:
    image: "aerokube/selenoid-ui"
    network_mode: bridge
    links:
      - selenoid
    ports:
      - "8080:8080"
    command: ["--selenoid-uri", "http://selenoid:4444"]
```

具体查看文档：
1. https://docs.docker.com/compose/gettingstarted/ 
2. http://aerokube.com/selenoid-ui/latest/#_with_docker_compose
3. https://aerokube.com/selenoid/latest/#_selenoid_cli_flags 

# codeceptjs
codecept是一个基于BDD的语言，有两种写测试的方式，一种就是先用自然语言定义好步骤，然后在关联js脚本去运行。一种是脚本跟自然语言写在一起，具体业务肯定还有要考虑的地方，这里就不再深究。


这里是[官方文档](https://codecept.io/)

下面是框架使用：
1. 下载nodejs
2. 下载nvm
3. 安装依赖
```
// 因为我们需要本地调试脚本，所以需要安装以下依赖.这里需要全部全局安装，否则容易出现莫名其妙的错

npm install -g codeceptjs
npm install -g webdriverio
npm install -g selenium-standalone@latest 
npm install -g mocha
npm install -g mochawesome 
npm install -g mocha-multi 

selenium-standalone install 
selenium-standalone satrt 

codeceptjs init 
```
4. 编写脚本

[codeceptjs命令操作](https://codecept.io/commands/)
```
codeceptjs gt //创建一个新case
codeceptjs gp //创建一个新的page对象，用来执行定义好的一些常规操作，比如登录，注册等等
codeceptjs run // 运行所有的测试
codeceptjs run --steps //运行所有的测试
```
[github 例子](https://github.com/TheFifthMan/E2ETest)

```
config : 主要用于搭建docker平台的配置文件
test_case: codeceptjs 测试相关文件
---| cases: 测试用例和代码写在一起
---| features: 自然语言的测试用例
---| step_definitions : 用于执行用例的代码
---| pages: 存放一些定义好的常规动作，比如登录，注册这样的代码
---| output: 存放报告文件
---| codeceptjs.json: codeceptjs的配置文件
---| package.json: npm init -y 
---| steps_file.js
```
[webdriverio语法规则](https://codecept.io/helpers/WebDriverIO/)

[选取元素](https://codecept.io/locators/)

5. 报告

一个好的测试，做出来的东西应该是要美观的，这里我们还可以结合mocha做一个漂亮的[测试报告](https://codecept.io/reports/)

![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/report.jpg)

可以看到，报告最后还有截图。

```
//运行一个htmlreport
codeceptjs run --reporter mochawesome

//运行多个report，html和log的
codeceptjs run --reporter mocha-multi
```
# 持续集成
说到持续集成，想到应该还是jenkins吧。下面简单演示一下搭建jenkins，虽然大家都会。下面简述一下操作步骤

#### 安装
```
# 下载jenkins
# scp jenkins.war root@192.168.31.64
# 下载tomcat
# scp tomcat.tar.gz root@192.168.31.64
# tar -zxvf tomcat.tar.gz
# mv tomcat /usr/local/
# mv jenkins.war /usr/local/tomcat/webapps/
# ./usr/local/tomcat/bin/startup.sh
```
然后遇到了问题，现在的tomcat越来越符合规范了，只能在本地访问，为了最佳实践，我们就再安装openresty 进行一个反向代理好了

```
# 下载
wget https://openresty.org/download/openresty-1.13.6.1.tar.gz
# 解压
tar -zxvf openresty-1.13.6.1.tar.gz 
# 重命名
mv openresty-1.13.6.1.tar.gz openresty
# 安装依赖
yum install pcre-devel openssl-devel gcc curl
# 安装
./configure
gmake 
gmake install

# 配置
cd /usr/local/openresty/nginx/conf/
vim tomcat.conf

# 增加以下内容到 tomcat.conf里面

upstream jenkins {
  keepalive 32; # keepalive connections
  server 127.0.0.1:8080; # jenkins ip and port
}

server {
  listen          80;       # Listen on port 80 for IPv4 requests

  server_name     jenkins.example.com;

  #this is the jenkins web root directory (mentioned in the /etc/default/jenkins file)
  root            /var/run/jenkins/war/;

  access_log      /var/log/nginx/jenkins/access.log;
  error_log       /var/log/nginx/jenkins/error.log;
  ignore_invalid_headers off; #pass through headers from Jenkins which are considered invalid by Nginx server.

  location ~ "^/static/[0-9a-fA-F]{8}\/(.*)$" {
    #rewrite all static files into requests to the root
    #E.g /static/12345678/css/something.css will become /css/something.css
    rewrite "^/static/[0-9a-fA-F]{8}\/(.*)" /$1 last;
  }

  location /userContent {
    #have nginx handle all the static requests to the userContent folder files
    #note : This is the $JENKINS_HOME dir
	root /var/lib/jenkins/;
    if (!-f $request_filename){
      #this file does not exist, might be a directory or a /**view** url
      rewrite (.*) /$1 last;
	  break;
    }
	sendfile on;
  }

  location @jenkins {
      sendfile off;
      proxy_pass         http://jenkins;
      proxy_redirect     default;
      proxy_http_version 1.1;

      proxy_set_header   Host              $host;
      proxy_set_header   X-Real-IP         $remote_addr;
      proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_max_temp_file_size 0;

      #this is the maximum upload size
      client_max_body_size       10m;
      client_body_buffer_size    128k;

      proxy_connect_timeout      90;
      proxy_send_timeout         90;
      proxy_read_timeout         90;
      proxy_buffering            off;
      proxy_request_buffering    off; # Required for HTTP CLI commands in Jenkins > 2.54
      proxy_set_header Connection ""; # Clear for keepalive
  }

  location / {
    # Optional configuration to detect and redirect iPhones
    if ($http_user_agent ~* '(iPhone|iPod)') {
      rewrite ^/$ /view/iphone/ redirect;
    }

    try_files $uri @jenkins;
  }
}



# 增加以下内容到nginx.conf里面
vim conf/nginx.conf

include "/usr/local/openresty/nginx/conf/tomcat.conf";


# 启动
./sbin/nginx

# 重启
./sbin/nginx -s reload

# 最好直接使用root安装，可以避免很多有的没有的错误
```


#### 权限配置
![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/jenkins.jpg)
#### job配置


```
在jenkins上面安装node
tar -xvf node.tar.xz
ln -s $PWD/bin/node /usrl/local/bin/node
ln -s $PWD/bin/npm /usr/local/bin/npm

```
![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/jenkinsjob.jpg)



# 测试结果展示
#### 存储的运行视频
![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/map4.jpg)

#### 运行时vnc
![image](https://raw.githubusercontent.com/TheFifthMan/postimages/master/UIAutomation/runtime.jpg)