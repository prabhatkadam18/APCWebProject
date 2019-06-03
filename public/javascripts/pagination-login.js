      /*-----------------Buttons-----------------------------------------*/
      var embtn='<center><a class="btn btn-primary btn-sm emailbtn actionbtns" style="background:#000"><span class="fa fa-envelope" style="color:#fff"></span></a>';
      var edbtn='<a class="btn btn-primary btn-sm editbtn actionbtns"><span class="fa fa-edit"></span></a>';
      //var debtn='<a class="btn btn-danger btn-sm deletebtn actionbtns"><span class="fa fa-trash"></span></a>';
      var acbtn='<a class="btn btn-success btn-sm activebtn actionbtns" id=""><span class="fa fa-check-circle"></span></a></center>';
      var dactb='<a class="btn btn-warning btn-sm activebtn actionbtns" id=""><span class="fa fa-times-circle"></span></a></center>';
      /*---Initialize DataTable------------------------------------------*/
      var table=  $('#usertable').DataTable( {
        "lengthMenu": [[10, 25, 50], [ 10, 25, 50]],
        serverSide:true,
        processing:true,
        columns: [
            {title : "User Id",data: "_id", 'orderable' : false, 'searchable' : false,'sClass':'tableId' },
            {title : "Usename/Email", data: "username", 'orderable' : true, 'searchable' : true,'sClass':'tableUname' },
            {title : "Phone", data: "phone", 'orderable' : false, 'searchable' : false,'sClass':'tablePhone' },
            {title : "City", data: "city", 'orderable' : true, 'searchable' : true,'sClass':'tableCity' },
            {title : "Status", data: "status", 'orderable' : true, 'searchable' : false,'sClass':'tableStatus' },
            {title : "Role", data: "role", 'orderable' : true, 'searchable' : false,'sClass':'tableRole' },
            {title : "Active", data: "active", 'orderable' : true, 'searchable' : false,"visible": false },
            {title : "Actions",data: null, 'orderable' : false, 'searchable' : false,'sClass':'tableAction'},
            ],
            "order": [[ 1, "asc" ]],

              ajax: {
                url: '/admin/userlist',
                type: 'POST',
                "data": function ( d ) {
                  d.roleFilter          = $('#roleFilter').val();
                  d.statusFilter        = $('#statusFilter').val();
                },
              },

            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
              if(aData.active) {
                  {active=dactb;}
              }
              else {
                  {active=acbtn;}
              }
              if(aData.role == 'commuity manager')
              {
                  $('td:eq(5)', nRow).html( 'Community Builder' );
              }
              if(aData.role=='superadmin')
              {
                $('td:eq(6)', nRow).html( embtn );
              } else {
               $('td:eq(6)', nRow).html( embtn+edbtn+active );//embtn+edbtn+debtn+active
             }
               return;
            }

    } );
    function refresh()
    {
        table.ajax.reload(null, false);
    }
      $(document).ready( function() {
          $('#roleFilter').on('change', function () {
              table.ajax.reload(null, false);
          });

          $('#statusFilter').on('change', function () {
              table.ajax.reload(null, false);
          });

          $('#usertable').fadeIn(2000); // show table in fade animation
          /*-------Pop Email With Vlaue------------------------------------------------*/
          $("#usertable tbody").on("click", ".emailbtn", function (e) {
              var tds = $(this).closest('tr').children('td');
              i = 0;
              tds.each(function (index, object) {
                  if (i == 2) {
                      return;
                  }
                  username = $(object).html();
                  i = i + 1;
              })
              $('#emailPop').val(username);
              $('#popUp').modal('toggle');
              $('#popUp').modal('show');
              $('#subject').val("(This mail is from CQ)");
              $('#body').val("Hey, " + username);
          });

          /*--------Pop Edit With Value------------------------------------------------*/
          $("#usertable").on("click", ".editbtn", function () {
              var tds = $(this).closest('tr').children('td');
              i = 0;
              tds.each(function (index, object) {
                  if (i == 0) {
                      id = $(object).html();
                  }
                  else if (i == 1) {
                      username = $(object).html();
                  }
                  else if (i == 2) {
                      phone = $(object).html();
                  }
                  else if (i == 3) {
                      city = $(object).html();
                  }
                  else if (i == 4) {
                      status = $(object).html();
                  }
                  else if (i == 5) {
                      role = $(object).html();
                  }
                  else {
                      return;
                  }
                  i++;
              })
              oldrole = role; //it will use to save old role for update
              if (role == 'admin') {
                  $("#role").val("admin");
              }
              if (role == 'user') {
                  $("#role").val("user");
              }
              if (role == 'commuity manager') {
                  $("#role").val("commuity manager");
              }
              if (status == "confirmed") {
                  $("#status").val("confirmed");
              }
              if (status == "pending") {
                  $("#status").val("pending");
              }
              $('#usernamePop').text("Update " + username);
              $('#_id').val(id);
              $('#username').val(username);
              $('#phone').val(phone);
              $('#city').val(city);
              $('#updateUser').modal('toggle');
              $('#updateUser').modal('show');
          });
          /*----Activate/Deactivate--------------------------------------------*/
          $("#usertable").on("click", ".activebtn", function () {
              var tds = $(this).closest('tr').children('td');
              i = 0;
              tds.each(function (index, Object, third) {
                  if (i == 0) {
                      id = $(Object).html();
                  }
                  else if (i == 1) {
                      username = $(Object).html();
                  }
                  i++;
              })
              var x = $(this);
              var temp;
              var older;
              var newer;
              var status = $(this).html();

              if(status=='<span class="fa fa-check-circle"></span>')
              {
                status='Activate';
              } else {
                status='Deactivate';
              }
              var data = {};
              data._id = id;
              if (status == "Deactivate") {
                  temp = 'Activate';
                  html ='<span class="fa fa-check-circle"></span>';
                  older = 'btn-warning';
                  newer = 'btn-success';
                  data.active = false;
              }
              else {
                  temp = 'Deactivate';
                  html ='<span class="fa fa-times-circle"></span>';
                  older = 'btn-success';
                  newer = 'btn-warning';
                  data.active = true;
              }

              $.confirm({
                  title:  status + ' User ?',
                  content: "Are you sure you want to " + status + " \"" + username + "\"",
                  buttons: {
                      'Yes': {
                          btnClass: 'btn-success',
                          action: function () {
                              $.ajax({
                                  type: 'POST',
                                  data: JSON.stringify(data),
                                  contentType: 'application/json',
                                  url: '/admin/activation',
                                  success: function (response) {
                                      x.html(html);
                                      x.removeClass(older).addClass(newer);
                                      notie.alert({type: 1, text: 'User ' + username + ' ' + status + 'd', time: 2})
                                  },
                                  error: function (response) {
                                      notie.alert({type: 3, text: 'Unable to update Something went wrong', time: 2})
                                  }
                              });
                          }
                      },
                      'No': {btnClass: 'btn-danger',}
                  }
              });
          });
          /*---------DeleteUser--------------------------------------------------------------*/
          /*
          $("#usertable").on("click", ".deletebtn", function () {
              var tds = $(this).closest('tr').children('td');
              i = 0;
              tds.each(function (index, Object, third) {
                  if (i == 0) {
                      id = $(Object).html();
                  }
                  else if (i == 1) {
                      username = $(Object).html();
                  }
                  else {
                      return;
                  }
                  i++;
              })
              var data = {};
              data._id = id;
              // new confirm added
              $.confirm({
                  title: 'Delete User!',
                  content: "Are you sure you want to delete " + username,
                  buttons: {

                      'Yes': {
                          btnClass: 'btn-success',
                          action: function () {
                              $.ajax({
                                  type: 'POST',
                                  data: JSON.stringify(data),
                                  contentType: 'application/json',
                                  url: '/admin/delete',
                                  success: function (response) {
                                      table.ajax.reload(null, false);
                                      notie.alert({type: 3, text: 'User ' + username + ' Deleted', time: 2})
                                  }
                              });
                          }
                      },
                      'No': {btnClass: 'btn-danger',}
                  }
              });
          });
          */
          /*---------------------Update Edit----------------------------------------*/
          $("#editsubmit").click(function () {
              var id = $('#_id').val();
              var username = $('#username').val().toLowerCase();
              var phone = $('#phone').val();
              var city = $('#city').val();
              var status = $('#status').val();
              var role = $('#role').val();
              var data = {};
              data._id = id;
              data.username = username;
              data.phone = phone;
              data.city = city;
              data.status = status;
              data.role = role;
              data.oldrole = oldrole;
              if (validateEmail(username)) {
                  if ((phone.trim().length && city.trim().length)) {
                    if(validatePhone(phone)){
                          $('#updateUser').modal('hide');
                          $.ajax({
                              type: 'POST',
                              data: JSON.stringify(data),
                              contentType: 'application/json',
                              url: '/admin/update',
                              success: function (response) {
                                  table.ajax.reload(null, false);
                                  notie.alert({type: 1, text: username + ' Updated', time: 2})
                              },
                              error: function (response) {
                                  notie.alert({type: 3, text: 'Unable to update Something went wrong', time: 2})
                              }
                          });
                    }else {
                      $.alert({
                          title: 'Inavlid! Phone Number',
                          content: 'Phone number is not valid',
                      });
                    }
                  } else {

                      if (phone.trim().length == 0) {
                          $("#phone").focus();
                      }
                      else if (city.trim().length == 0) {
                          $("#city").focus();
                      }

                      $.alert({
                          title: 'Inavlid!',
                          content: 'All fields are required!',
                      });
                  }
              } else {
                  $("#username").focus();
                  $.dialog({
                      title: 'Invalid Username!',
                      content: 'Username Must be an email!',
                  });
              }
          });
          /*---mail sending --------------------------------------------------*/
          $('#mailbutton').click(function () {
              var to = $('#emailPop').val();
              var subject = $('#subject').val();
              var body = $('#body').val();
              details = {};
              details.username = to;
              details.subject = subject;
              details.body = body;
              $('#popUp').modal('hide');
              $.ajax({
                  type: 'POST',
                  data: JSON.stringify(details),
                  contentType: 'application/json',
                  url: '/admin/sendmail',
                  success: function (response) {
                      notie.alert({type: 1, text: 'Email Sent To ' + to, time: 2})
                  },
                  error: function (err) {
                      notie.alert({type: 3, text: 'Something went wrong Email Not sent to '+to, time: 2})
                  }
              });
          });
      });
