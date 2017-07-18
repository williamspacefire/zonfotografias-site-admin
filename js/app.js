/**
 * Created by williamspacefire on 4/26/17.
 */
var app = angular.module('BlankApp', ['ngMaterial', 'ngRoute']);
var token;

app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled:true,
        basepath:true
    });
    $routeProvider.when("/", {
        templateUrl:"view/login.html",
        controller:"ctrl"
   }).when("/contact", {
       templateUrl:"view/contact.html",
        controller:"contact"
    }).when("/bio", {
       templateUrl:"view/bio.html",
        controller:"bio"
    }).when("/menus", {
       templateUrl:"view/menus.html",
        controller:"menus"
    }).when("/portfolio", {
       templateUrl:"view/portfolio.html",
        controller:"portfolio"
    }).when("/slide", {
       templateUrl:"view/slide.html",
        controller:"slide"
    }).when("/reviews", {
       templateUrl:"view/review.html",
        controller:"reviews"
    }).otherwise({
        redirectTo:"/"
    })
});

//Default controller
app.controller("ctrl", function ($scope, $http, $rootScope, $location, $mdDialog) {

    $rootScope.isLogged = function (r) {
        if(r){
            if((!sessionStorage.getItem("token"))) $location.path("/");
        }else{
            return !(!sessionStorage.getItem("token"));
        }
    };

    $rootScope.isLogged(true);

    $rootScope.toolbar = true;
    $rootScope.loading = false;

    $rootScope.database = {};
    $rootScope.database.contact = null;
    $rootScope.database.bio = null;
    $rootScope.database.menus = null;
    $rootScope.database.portfolio = null;
    $rootScope.database.slide = null;
    $rootScope.database.reviews = null;

    function get() {
        if($rootScope.isLogged() && token){
            $http.get(config.databaseURL+"/contact.json?auth="+token).then(function (data) {
                $rootScope.database.contact = (data.data === null) ? true : data.data;
            });
            $http.get(config.databaseURL+"/bio.json?auth="+token).then(function (data) {
                $rootScope.database.bio = data.data;
            });
            $http.get(config.databaseURL+"/menus.json?auth="+token).then(function (data) {
                $rootScope.database.menus = data.data;
            });
            $http.get(config.databaseURL+"/portfolio.json?auth="+token).then(function (data) {
                $rootScope.database.portfolio = data.data;
            });
            $http.get(config.databaseURL+"/slide.json?auth="+token).then(function (data) {
                $rootScope.database.slide = data.data;
            });
            $http.get(config.databaseURL+"/reviews.json?auth="+token).then(function (data) {
                $rootScope.database.reviews = data.data;
            });
        }else{
            token = sessionStorage.getItem("token");
            setTimeout(function () {
                get();
            }, 1000);
        }
    }

    setTimeout(function () {
        get();
    }, 1000);

    $scope.logout = function () {
        sessionStorage.removeItem("token");
        $location.path("/");
    };

    $scope.save = function () {
        $rootScope.loading = true;

        var page = $location.url();
        var data = null;

        switch (page){
            case "/contact":
                data = $rootScope.database.contact;
                break;
            case "/bio":
                data = $rootScope.database.bio;
                break;
            case "/menus":
                data = $rootScope.database.menus;
                break;
            case "/portfolio":
                data = $rootScope.database.portfolio;
                break;
            case "/slide":
                data = $rootScope.database.slide;
                break;
            case "/reviews":
                data = $rootScope.database.reviews;
                break;
        }

        $http.put(config.databaseURL+page+".json?auth="+token, data).then(function (response) {
            $rootScope.loading = false;
            $mdDialog.show(
                $mdDialog.alert()
                    .title("Sucesso!")
                    .textContent("As mudanças foram salvas com sucesso!")
                    .ok("Ok")
            )
        }, function (error) {
            $rootScope.loading = false;
            $mdDialog.show(
                $mdDialog.alert()
                    .title("Erro ao salvar")
                    .textContent("Ocorreu um erro ao salvar suas mudanças, verifique se vc esta logado e se tem permissao para executar esta açao.")
                    .ok("Ok, vou verificar")
            )
        })
    }
});

//Login controller
app.controller("loginCtrl", function ($scope, $rootScope, $location, $http, $mdDialog) {
    if($rootScope.isLogged(false)) $location.path("/contact/");

    $rootScope.toolbar = false;
    $rootScope.loading = false;

    $scope.signin = function (login) {
        $rootScope.loading = true;
        var auth = firebase.auth().signInWithEmailAndPassword(login.email, login.password);
        auth.catch(function (error) {
            $rootScope.loading = false;
            var title, text, code = error.code, message = error.message;

            switch (code){
                case "auth/invalid-email":
                    title = "Email invalido";
                    text = "Este nao e um email valido";
                break;
                case "auth/user-disabled":
                    title = "Conta desativado";
                    text = "Esta conta esta desativada, entre em contato com o Admin.";
                break;
                case "auth/user-not-found":
                    title = "Usuario nao encontrado";
                    text = "O Email digitado esta incorreto ou nao esta cadastrado no nosso sistema";
                break;
                case "auth/wrong-password":
                    title = "Senha incorreta";
                    text = "A senha digitada esta incorreta.";
                break;
                default:
                    title = "Erro desconhecido";
                    text = message;
                break;
            }

            $mdDialog.show(
                $mdDialog.alert()
                    .title(title)
                    .textContent(text)
                    .ok("Ok")
            );
        });
        auth.then(function (result) {
            result.getToken().then(function (token) {
                $http.get(config.databaseURL+"/admin/"+result.uid+".json?auth="+token).then(function (response) {
                    $rootScope.loading = false;
                    if(response.data){
                        sessionStorage.setItem("token", token);
                        $location.path("/contact/");
                    }else{
                        $mdDialog.show(
                            $mdDialog.alert()
                                .title("Erro de login")
                                .textContent("Voce nao pode acessar o contact, sua conta nao tem permiçao para executar esta açao, entre em contato com o Admin.")
                                .ok("Ok")
                        );
                    }
                })
            })
        })
    };

    $scope.resetpassword = function () {
        $mdDialog.show(
            $mdDialog.prompt()
                .title("Redefinição de senha")
                .textContent("Um email com o link para redefiniçao de senha sera enviado.")
                .ariaLabel("Email")
                .placeholder("Digite seu email")
                .ok("Enviar")
                .cancel("Cancelar")
        ).then(function (result) {
            $rootScope.loading = true;
            firebase.auth().sendPasswordResetEmail(result).then(function (success) {
                $rootScope.loading = false;
                $mdDialog.show(
                    $mdDialog.alert()
                        .title("Email enviado com sucesso!")
                        .textContent("Seu email com o link de redefiniçao foi enviado.")
                        .ok("OK")
                );
            }).catch(function (error) {
                $rootScope.loading = false;
                $mdDialog.show(
                    $mdDialog.alert()
                        .title(error.code)
                        .textContent(error.message)
                        .ok("OK")
                );
            })
        })
    }
});

//contact controller
app.controller("contact", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;
    
    $scope.deletecontact = function (index) {
        delete $rootScope.database.contact[index];
    };

    $scope.showMessage = function (msg, name) {
        $mdDialog.show(
            $mdDialog.alert()
                .title("Mensagem de "+name)
                .textContent(msg)
                .ok("OK")
        );
    }
});

//bio controller
app.controller("bio", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;
});

//review controller
app.controller("reviews", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;
});

//portfolio controller
app.controller("portfolio", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;

    $scope.addCat = function () {
        $rootScope.database.portfolio.categories.push({name:"",thumb:"",page:""});
    };

    $scope.deleteCategory = function (index) {
        $rootScope.database.portfolio.category[$rootScope.database.portfolio.categories[index].page] = {};
        $rootScope.database.portfolio.categories.splice(index, 1);
    };
    
    $scope.addP = function (photo) {
        if(!$rootScope.database.portfolio.category[photo.page]){
            $rootScope.database.portfolio.category[photo.page] = [];
        }
        $rootScope.database.portfolio.category[photo.page].push("Imagem "+($rootScope.database.portfolio.category[photo.page].length+1));
    };
    
    $scope.deletelink = function (index, page) {
        $rootScope.database.portfolio.category[page].splice(index, 1);
    }
});

//menus controller
app.controller("menus", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;

    $scope.deletemenu = function (index) {
        $rootScope.database.menus.menu.splice(index, 1);
    };

    $scope.deletesocial = function (index) {
        $rootScope.database.menus.social.splice(index, 1);
    };

    $scope.add = function () {
        $rootScope.database.menus.menu.push({link:"",name:""});
    };

    $scope.addSocial = function () {
        $rootScope.database.menus.social.push({link:"",usarname:"",icon:"",hide:true});
    }
});

//slide controller
app.controller("slide", function ($scope, $rootScope, $mdDialog) {
    $rootScope.isLogged(true);
    $rootScope.toolbar = true;

    $scope.deleteslide = function (index) {
        $rootScope.database.slide.splice(index, 1);
    };
    
    $scope.addSlide = function () {
        $rootScope.database.slide.push("Slide "+($rootScope.database.slide.length+1));
    }
});